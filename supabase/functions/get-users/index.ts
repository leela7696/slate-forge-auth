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

    // Verify user has admin access
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', payload.userId)
      .single();

    if (!user || !['Admin', 'System Admin'].includes(user.role)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse filters from query params (GET) or JSON body (POST)
    const url = new URL(req.url);
    let search = url.searchParams.get('search') || '';
    let role = url.searchParams.get('role') || '';
    let status = url.searchParams.get('status') || '';
    let page = parseInt(url.searchParams.get('page') || '1', 10);
    let limit = parseInt(url.searchParams.get('limit') || '10', 10);

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        search = body?.search ?? search;
        role = body?.role ?? role;
        status = body?.status ?? status;
        page = parseInt(String(body?.page ?? page), 10);
        limit = parseInt(String(body?.limit ?? limit), 10);
      } catch (_) {
        // ignore body parse errors
      }
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let baseQuery = supabaseAdmin
      .from('users')
      .select('id, name, email, role, phone, department, status, last_login_at, created_at, profile_picture_url', { count: 'exact' })
      .eq('is_deleted', false);

    if (role) {
      baseQuery = baseQuery.eq('role', role);
    }

    if (status) {
      baseQuery = baseQuery.eq('status', status);
    }

    if (search) {
      // Search by name or email
      baseQuery = baseQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Get total count
    const { count: totalCount, error: countError } = await baseQuery
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // Fetch paginated data
    const { data: users, error } = await baseQuery
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return new Response(
      JSON.stringify({ 
        users: users || [],
        page,
        limit,
        total: totalCount || 0
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
