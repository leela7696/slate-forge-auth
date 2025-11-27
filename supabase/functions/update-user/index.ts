import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verify } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

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

    // Only Admin and System Admin can update users
    const { data: actor } = await supabaseAdmin
      .from('users')
      .select('role, email')
      .eq('id', payload.userId)
      .single();

    if (!actor || !['Admin', 'System Admin'].includes(actor.role)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId, name, email, role, status } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (name) updates.name = name;
    if (email) updates.email = String(email).toLowerCase();
    if (role) {
      // Validate role exists in roles table (supports custom roles)
      const { data: roleRow } = await supabaseAdmin
        .from('roles')
        .select('id, name')
        .eq('name', role)
        .maybeSingle();

      if (!roleRow) {
        const builtIn = ['System Admin', 'Admin', 'Manager', 'User'];
        if (!builtIn.includes(role)) {
          return new Response(
            JSON.stringify({ error: 'Invalid role: not found' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      updates.role = role;
    }
    if (status) {
      const validStatuses = ['active', 'inactive'];
      if (!validStatuses.includes(status)) {
        return new Response(
          JSON.stringify({ error: 'Invalid status' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      updates.status = status;
    }

    // Email uniqueness check if changing email
    if (updates.email) {
      const { data: existing } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', updates.email)
        .eq('is_deleted', false)
        .neq('id', userId)
        .maybeSingle();
      if (existing) {
        return new Response(
          JSON.stringify({ error: 'Email already in use' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const { data: targetUser } = await supabaseAdmin
      .from('users')
      .select('id, email, role, status')
      .eq('id', userId)
      .single();

    if (!targetUser) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: updated, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select('*')
      .single();

    if (error) throw error;

    await supabaseAdmin.from('audit_logs').insert({
      action: 'USER_UPDATED',
      module: 'users',
      actor_id: payload.userId,
      actor_email: actor.email,
      actor_role: actor.role,
      target_id: userId,
      target_type: 'user',
      success: true,
      details: { before: targetUser, after: { email: updated.email, role: updated.role, status: updated.status } },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
    });

    return new Response(
      JSON.stringify({ success: true, user: updated }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in update-user:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
