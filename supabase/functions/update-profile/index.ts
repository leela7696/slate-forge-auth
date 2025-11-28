import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import { verify } from "https://deno.land/x/djwt@v3.0.1/mod.ts";
import { auditLogger } from "../_shared/auditLogger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function verifyToken(token: string) {
  try {
    const jwtSecret = Deno.env.get('JWT_SECRET') ?? '';
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(jwtSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const payload = await verify(token, key);
    return payload;
  } catch (error) {
    console.error('JWT verification error:', error);
    throw new Error('Invalid JWT');
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = await verifyToken(token);
    const userId = payload.userId as string;

    if (!userId) {
      throw new Error('Invalid token payload');
    }

    const { name, phone, department, profile_picture_url } = await req.json();

    // Validate input
    if (name !== undefined && (!name || name.trim().length === 0)) {
      return new Response(
        JSON.stringify({ error: 'Name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (phone && phone.length > 15) {
      return new Response(
        JSON.stringify({ error: 'Phone number is too long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch current values for before/after logging
    const { data: currentUser } = await supabase
      .from('users')
      .select('name, phone, department, profile_picture_url, email, role')
      .eq('id', userId)
      .single();

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (department !== undefined) updateData.department = department?.trim() || null;
    if (profile_picture_url !== undefined) updateData.profile_picture_url = profile_picture_url || null;

    // Update user profile
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }

    // Build before/after values for changed fields only
    const beforeValues: Record<string, any> = {};
    const afterValues: Record<string, any> = {};
    
    if (name !== undefined && currentUser?.name !== name) {
      beforeValues.name = currentUser?.name;
      afterValues.name = name;
    }
    if (phone !== undefined && currentUser?.phone !== phone) {
      beforeValues.phone = currentUser?.phone;
      afterValues.phone = phone;
    }
    if (department !== undefined && currentUser?.department !== department) {
      beforeValues.department = currentUser?.department;
      afterValues.department = department;
    }
    if (profile_picture_url !== undefined && currentUser?.profile_picture_url !== profile_picture_url) {
      beforeValues.profile_picture_url = currentUser?.profile_picture_url;
      afterValues.profile_picture_url = profile_picture_url;
    }

    // Create audit log with before/after values
    await auditLogger(supabase, {
      action: 'PROFILE_UPDATED',
      module: 'Profile',
      actorId: userId,
      actorEmail: data.email,
      actorRole: data.role,
      targetId: userId,
      targetEmail: data.email,
      beforeValues,
      afterValues,
      success: true,
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    });

    console.log(`Profile updated successfully for user ${userId}`);

    return new Response(
      JSON.stringify({ success: true, user: data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in update-profile:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: error.message === 'Invalid JWT' ? 401 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});