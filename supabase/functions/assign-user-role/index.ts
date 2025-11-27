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

async function checkPermission(supabase: any, userId: string, module: string, action: string) {
  const { data: user } = await supabase.from('users').select('role').eq('id', userId).single();
  if (!user) return false;
  
  const { data: roleData } = await supabase.from('roles').select('id').eq('name', user.role).single();
  if (!roleData) return false;
  
  const { data: permission } = await supabase.from('permissions').select('*').eq('role_id', roleData.id).eq('module', module).single();
  if (!permission) return false;
  
  const fieldMap: Record<string, string> = { 'view': 'can_view', 'create': 'can_create', 'edit': 'can_edit', 'delete': 'can_delete' };
  return permission[fieldMap[action]] === true;
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

    // Check if user has permission to edit users (role assignment is an edit operation)
    const hasPermission = await checkPermission(supabaseAdmin, payload.userId, 'User Management', 'edit');
    
    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - You do not have permission to assign user roles' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get user role for audit logging
    const { data: user } = await supabaseAdmin.from('users').select('role').eq('id', payload.userId).single();

    const { userId, role } = await req.json();

    if (!userId || !role) {
      return new Response(
        JSON.stringify({ error: 'userId and role are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate role exists in the roles table
    const { data: roleExists } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', role)
      .single();

    if (!roleExists) {
      return new Response(
        JSON.stringify({ error: 'Invalid role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get target user info
    const { data: targetUser } = await supabaseAdmin
      .from('users')
      .select('email, role')
      .eq('id', userId)
      .single();

    if (!targetUser) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update user role
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin.from('audit_logs').insert({
      action: 'USER_ROLE_CHANGED',
      module: 'rbac',
      actor_id: payload.userId,
      actor_email: payload.email,
      actor_role: user?.role || 'unknown',
      target_id: userId,
      success: true,
      details: { 
        target_email: targetUser.email,
        old_role: targetUser.role,
        new_role: role 
      },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
    });

    return new Response(
      JSON.stringify({ success: true, user: data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in assign-user-role:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
