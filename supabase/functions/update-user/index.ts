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

    // Check if user has permission to edit users
    const hasPermission = await checkPermission(supabaseAdmin, payload.userId, 'User Management', 'edit');
    
    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - You do not have permission to edit users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get user role for audit logging
    const { data: user } = await supabaseAdmin.from('users').select('role').eq('id', payload.userId).single();

    const { userId, name, email, role, status, phone, department } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get target user info for audit
    const { data: targetUser } = await supabaseAdmin
      .from('users')
      .select('email, role, name, status, phone, department')
      .eq('id', userId)
      .single();

    if (!targetUser) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build update object
    const updateData: any = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;
    if (phone !== undefined) updateData.phone = phone;
    if (department !== undefined) updateData.department = department;

    // Update user
    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Build before/after values for changed fields only
    const beforeValues: Record<string, any> = {};
    const afterValues: Record<string, any> = {};
    
    if (name !== undefined && targetUser.name !== name) {
      beforeValues.name = targetUser.name;
      afterValues.name = name;
    }
    if (email !== undefined && targetUser.email !== email) {
      beforeValues.email = targetUser.email;
      afterValues.email = email;
    }
    if (role !== undefined && targetUser.role !== role) {
      beforeValues.role = targetUser.role;
      afterValues.role = role;
    }
    if (status !== undefined && targetUser.status !== status) {
      beforeValues.status = targetUser.status;
      afterValues.status = status;
    }
    if (phone !== undefined && targetUser.phone !== phone) {
      beforeValues.phone = targetUser.phone;
      afterValues.phone = phone;
    }
    if (department !== undefined && targetUser.department !== department) {
      beforeValues.department = targetUser.department;
      afterValues.department = department;
    }

    // Log audit with before/after
    await auditLogger(supabaseAdmin, {
      action: 'USER_UPDATED',
      module: 'User Management',
      actorId: payload.userId,
      actorEmail: payload.email,
      actorRole: user?.role || 'unknown',
      targetId: userId,
      targetEmail: updatedUser.email,
      targetSummary: `Updated user: ${updatedUser.name}`,
      beforeValues,
      afterValues,
      success: true,
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    });

    return new Response(
      JSON.stringify({ success: true, user: updatedUser }),
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
