import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verify } from "https://deno.land/x/djwt@v3.0.1/mod.ts";
import { auditLogger } from "../_shared/auditLogger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function verifyToken(token: string) {
  const jwtSecret = Deno.env.get('JWT_SECRET') ?? '';
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(jwtSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  return await verify(token, key);
}

type TargetType = 'all' | 'role' | 'user';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = await verifyToken(token) as any;

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Only Admin and System Admin can broadcast
    const { data: actor } = await supabaseAdmin
      .from('users')
      .select('id, email, role, name')
      .eq('id', payload.userId)
      .single();

    if (!actor || (actor.role !== 'Admin' && actor.role !== 'System Admin')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Only Admin or System Admin can broadcast notifications' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const method = (body?.method || 'SEND') as 'SEND' | 'PREVIEW';
    const title: string = String(body?.title || '').trim();
    const message: string = String(body?.message || '').trim();
    const targetType: TargetType = body?.targetType as TargetType;
    const roleName: string | undefined = body?.roleName ? String(body.roleName) : undefined;
    const userId: string | undefined = body?.userId ? String(body.userId) : undefined;

    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: 'Title and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!targetType || !['all', 'role', 'user'].includes(targetType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid target type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (targetType === 'role' && !roleName) {
      return new Response(
        JSON.stringify({ error: 'roleName is required for role target' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (targetType === 'user' && !userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required for user target' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine recipients
    let recipientsQuery = supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('is_deleted', false)
      .eq('status', 'active');

    if (targetType === 'role' && roleName) {
      recipientsQuery = recipientsQuery.eq('role', roleName);
    }
    if (targetType === 'user' && userId) {
      recipientsQuery = recipientsQuery.eq('id', userId);
    }

    const { data: recipients, error: recipientsError } = await recipientsQuery;
    if (recipientsError) throw recipientsError;

    const recipientsList = (recipients || []).map((r: any) => ({ id: r.id as string, email: r.email as string, role: r.role as string }));
    const recipientsCount = recipientsList.length;

    if (method === 'PREVIEW') {
      return new Response(
        JSON.stringify({ recipientsCount }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (recipientsCount === 0) {
      return new Response(
        JSON.stringify({ error: 'No recipients found for the selected target' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert notifications in bulk
    const nowIso = new Date().toISOString();
    const rows = recipientsList.map((r) => ({
      user_id: r.id,
      title,
      message,
      is_read: false,
      created_at: nowIso,
    }));

    const { error: insertError } = await supabaseAdmin
      .from('notifications')
      .insert(rows);

    if (insertError) throw insertError;

    // Optional: log broadcast summary
    await auditLogger(supabaseAdmin, {
      action: 'NOTIFICATIONS_BROADCAST',
      module: 'notifications',
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      success: true,
      metadata: {
        targetType,
        roleName: roleName || null,
        recipientsCount,
        titleLength: title.length,
        messageLength: message.length,
      },
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    });

    // If broadcast_logs table exists, insert a record (best-effort)
    try {
      await supabaseAdmin.from('broadcast_logs').insert({
        title,
        message,
        recipients_count: recipientsCount,
        sent_by: actor.id,
        sent_at: nowIso,
        target_type: targetType,
        role_name: roleName || null,
      });
    } catch (e) {
      // ignore if table not found or no permissions
    }

    return new Response(
      JSON.stringify({ success: true, recipientsCount }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in broadcast-notifications:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

