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

    const { roleId } = await req.json();

    if (!roleId) {
      return new Response(
        JSON.stringify({ error: 'roleId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: permissions, error } = await supabaseAdmin
      .from('permissions')
      .select('*')
      .eq('role_id', roleId)
      .order('module', { ascending: true });

    if (error) throw error;

    return new Response(
      JSON.stringify({ permissions: permissions || [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in get-permissions:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
