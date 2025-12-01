import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  exp?: number;
}

async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));

    // Optional expiration check (matches get-audit-logs behavior)
    if (payload.exp && payload.exp < Date.now() / 1000) {
      console.error('Token expired');
      return null;
    }
    
    return payload as JWTPayload;
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
}

async function checkPermission(supabase: any, userId: string, module: string, action: string) {
  // Get user's role
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  
  if (!user) return false;
  
  // System Admin and Admin have full access to user management
  if (user.role === 'System Admin' || user.role === 'Admin') return true;
  
  // Get role ID
  const { data: roleData } = await supabase
    .from('roles')
    .select('id')
    .eq('name', user.role)
    .single();
  
  if (!roleData) return false;
  
  // Check permission
  const { data: permission } = await supabase
    .from('permissions')
    .select('*')
    .eq('role_id', roleData.id)
    .eq('module', module)
    .single();
  
  if (!permission) return false;
  
  const fieldMap: Record<string, string> = {
    'view': 'can_view',
    'create': 'can_create',
    'edit': 'can_edit',
    'delete': 'can_delete'
  };
  
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
    const payload = await verifyToken(token);

    if (!payload || !payload.userId) {
      console.error('Invalid token payload:', payload);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if user has permission to view User Management
    const hasPermission = await checkPermission(supabaseAdmin, payload.userId, 'User Management', 'view');
    
    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - You do not have permission to view users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get query parameters for filtering and pagination
    const url = new URL(req.url);
    const search = (url.searchParams.get('search') || '').trim();
    const roleFilter = (url.searchParams.get('role') || '').trim();
    const statusFilter = (url.searchParams.get('status') || '').trim();
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Build query
    let query = supabaseAdmin
      .from('users')
      .select('id, name, email, role, phone, department, status, last_login_at, created_at, profile_picture_url', { count: 'exact' })
      .eq('is_deleted', false);

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply role filter
    if (roleFilter) {
      query = query.eq('role', roleFilter);
    }

    // Apply status filter
    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

    if (error) throw error;

    return new Response(
      JSON.stringify({ 
        users: users || [], 
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in get-users:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
