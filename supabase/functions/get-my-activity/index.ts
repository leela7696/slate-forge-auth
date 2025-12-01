import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JWTPayload {
  userId: string;
  email?: string;
  role?: string;
  exp?: number;
}

async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      console.error('Token expired');
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

async function checkPermission(
  supabase: any,
  userId: string,
  module: string,
  action: string
): Promise<boolean> {
  // Get user's role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (!userData) return false;

  // System Admin and Admin have all permissions
  if (userData.role === 'System Admin' || userData.role === 'Admin') {
    return true;
  }

  // Check role-based permissions
  const { data: roleData } = await supabase
    .from('roles')
    .select('id')
    .eq('name', userData.role)
    .single();

  if (!roleData) return false;

  const { data: permissionData } = await supabase
    .from('permissions')
    .select('*')
    .eq('role_id', roleData.id)
    .eq('module', module)
    .single();

  if (!permissionData) return false;

  switch (action) {
    case 'view': return permissionData.can_view || false;
    case 'create': return permissionData.can_create || false;
    case 'edit': return permissionData.can_edit || false;
    case 'delete': return permissionData.can_delete || false;
    default: return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userToken = req.headers.get('x-user-token');
    if (!userToken) {
      return new Response(
        JSON.stringify({ error: 'Missing user token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = await verifyToken(userToken);

    if (!payload || !payload.userId) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = payload.userId;

    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check permission to view own activity
    const hasPermission = await checkPermission(supabaseAdmin, userId, 'My Activity', 'view');
    
    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - You do not have permission to view your activity logs' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const actionFilter = url.searchParams.get('action') || '';
    const startDate = url.searchParams.get('startDate') || '';
    const endDate = url.searchParams.get('endDate') || '';

    const offset = (page - 1) * limit;

    // Build query - only fetch logs where actor_id matches current user
    let query = supabaseAdmin
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('actor_id', userId) // CRITICAL: only show user's own logs
      .order('created_at', { ascending: false });

    // Apply search filter
    if (search) {
      query = query.or(`action.ilike.%${search}%,module.ilike.%${search}%`);
    }

    // Apply action filter
    if (actionFilter) {
      query = query.eq('action', actionFilter);
    }

    // Apply date range filters
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: logs, error, count } = await query;

    if (error) {
      console.error('Error fetching activity logs:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch activity logs' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        logs: logs || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
