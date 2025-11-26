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

    // Only System Admin can manage roles
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', payload.userId)
      .single();

    if (!user || user.role !== 'System Admin') {
      return new Response(
        JSON.stringify({ error: 'Only System Admin can manage roles' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { method, roleId, name, description } = await req.json();

    if (method === 'CREATE') {
      // Check if role name already exists
      const { data: existingRole } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('name', name)
        .maybeSingle();

      if (existingRole) {
        return new Response(
          JSON.stringify({ error: 'A role with this name already exists' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabaseAdmin
        .from('roles')
        .insert({ name, description })
        .select()
        .single();

      if (error) throw error;

      await supabaseAdmin.from('audit_logs').insert({
        action: 'ROLE_CREATED',
        module: 'rbac',
        actor_id: payload.userId,
        actor_email: payload.email,
        actor_role: user.role,
        success: true,
        details: { role_name: name },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
      });

      return new Response(
        JSON.stringify({ success: true, role: data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'UPDATE') {
      // Check if another role with the same name exists (excluding current role)
      const { data: existingRole } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('name', name)
        .neq('id', roleId)
        .maybeSingle();

      if (existingRole) {
        return new Response(
          JSON.stringify({ error: 'A role with this name already exists' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabaseAdmin
        .from('roles')
        .update({ name, description })
        .eq('id', roleId)
        .select()
        .single();

      if (error) throw error;

      await supabaseAdmin.from('audit_logs').insert({
        action: 'ROLE_UPDATED',
        module: 'rbac',
        actor_id: payload.userId,
        actor_email: payload.email,
        actor_role: user.role,
        success: true,
        details: { role_id: roleId, role_name: name },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
      });

      return new Response(
        JSON.stringify({ success: true, role: data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'DELETE') {
      // Check if role is assigned to any users
      const { count } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', name);

      if (count && count > 0) {
        return new Response(
          JSON.stringify({ error: 'Cannot delete role that is assigned to users' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabaseAdmin
        .from('roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      await supabaseAdmin.from('audit_logs').insert({
        action: 'ROLE_DELETED',
        module: 'rbac',
        actor_id: payload.userId,
        actor_email: payload.email,
        actor_role: user.role,
        success: true,
        details: { role_id: roleId, role_name: name },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
      });

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid method' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in manage-role:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
