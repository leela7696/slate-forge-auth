import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verify } from 'https://deno.land/x/djwt@v3.0.1/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function verifyToken(token: string) {
  const JWT_SECRET = Deno.env.get('JWT_SECRET');
  if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  return await verify(token, key);
}

async function checkPermission(
  supabase: any,
  userId: string,
  module: string,
  action: string
): Promise<boolean> {
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (!user) return false;
  
  // System Admin has full access
  if (user.role === 'System Admin') return true;

  // Get role ID from role name
  const { data: role } = await supabase
    .from('roles')
    .select('id')
    .eq('name', user.role)
    .single();

  if (!role) return false;

  // Get permission for this role and module
  const { data: permission } = await supabase
    .from('permissions')
    .select('*')
    .eq('role_id', role.id)
    .eq('module', module)
    .maybeSingle();

  if (!permission) return false;

  const fieldMap: Record<string, string> = {
    'view': 'can_view',
    'create': 'can_create',
    'edit': 'can_edit',
    'delete': 'can_delete'
  };

  return permission[fieldMap[action]] === true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = await verifyToken(token);
    const userId = payload.sub as string;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if user has permission to view audit logs
    const hasPermission = await checkPermission(supabase, userId, 'Audit Logs', 'view');
    
    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
    const search = url.searchParams.get('search') || '';
    const action = url.searchParams.get('action') || '';
    const module = url.searchParams.get('module') || '';
    const success = url.searchParams.get('success') || '';
    const startDate = url.searchParams.get('startDate') || '';
    const endDate = url.searchParams.get('endDate') || '';

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Build query
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`actor_email.ilike.%${search}%,target_email.ilike.%${search}%`);
    }
    if (action) {
      query = query.eq('action', action);
    }
    if (module) {
      query = query.eq('module', module);
    }
    if (success) {
      query = query.eq('success', success === 'true');
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    query = query.range(from, to);

    const { data: logs, error, count } = await query;

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        logs,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
