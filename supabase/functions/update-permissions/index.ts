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
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (!user) return false;

  const { data: role } = await supabase
    .from('roles')
    .select('id')
    .eq('name', user.role)
    .single();

  if (!role) return false;

  const { data: permission } = await supabase
    .from('permissions')
    .select('*')
    .eq('role_id', role.id)
    .eq('module', module)
    .single();

  if (!permission) return false;

  const actionMap: Record<string, string> = {
    view: 'can_view',
    create: 'can_create',
    edit: 'can_edit',
    delete: 'can_delete',
  };

  return permission[actionMap[action]] === true;
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

    // Load user to check role and permissions
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', payload.userId)
      .single();

    // Allow System Admin by role, otherwise require RBAC edit permission
    let hasEditPermission = false;
    if (user && user.role === 'System Admin') {
      hasEditPermission = true;
    } else {
      hasEditPermission = await checkPermission(supabaseAdmin, payload.userId, 'RBAC', 'edit');
    }

    if (!hasEditPermission) {
      return new Response(
        JSON.stringify({ error: 'You do not have permission to update permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { roleId, permissions } = await req.json();

    if (!roleId || !permissions || !Array.isArray(permissions)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update or insert permissions
    for (const perm of permissions) {
      const { id, module, can_view, can_create, can_edit, can_delete } = perm;

      if (id) {
        // Update existing permission
        await supabaseAdmin
          .from('permissions')
          .update({ can_view, can_create, can_edit, can_delete })
          .eq('id', id);
      } else {
        // Insert new permission
        await supabaseAdmin
          .from('permissions')
          .insert({
            role_id: roleId,
            module,
            can_view,
            can_create,
            can_edit,
            can_delete
          });
      }
    }

    // Get user role for audit log
    const { data: auditUser } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', payload.userId)
      .single();

    await supabaseAdmin.from('audit_logs').insert({
      action: 'PERMISSIONS_UPDATED',
      module: 'rbac',
      actor_id: payload.userId,
      actor_email: payload.email,
      actor_role: auditUser?.role || 'unknown',
      success: true,
      details: { role_id: roleId, permissions_count: permissions.length },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in update-permissions:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
