import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import { verify } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

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

    const { name, phone, department } = await req.json();

    // Validate input
    if (!name || name.trim().length === 0) {
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

    // Update user profile
    const { data, error } = await supabase
      .from('users')
      .update({
        name: name.trim(),
        phone: phone?.trim() || null,
        department: department?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }

    // Create audit log
    await supabase.from('audit_logs').insert({
      action: 'PROFILE_UPDATED',
      module: 'profile',
      actor_id: userId,
      actor_email: data.email,
      actor_role: data.role,
      success: true,
      details: { updated_fields: { name, phone, department } },
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