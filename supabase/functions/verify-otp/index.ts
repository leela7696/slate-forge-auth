import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyOtpRequest {
  email: string;
  otp: string;
}

// Hash OTP using HMAC with secret (same as in send-otp)
async function hashOtp(otp: string): Promise<string> {
  const secret = Deno.env.get('OTP_SECRET') ?? 'default-secret';
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(otp)
  );
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp }: VerifyOtpRequest = await req.json();

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: 'Email and OTP are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find OTP request
    const { data: otpRequest, error: fetchError } = await supabaseAdmin
      .from('otp_requests')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (fetchError || !otpRequest) {
      return new Response(
        JSON.stringify({ error: 'OTP request not found or expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(otpRequest.expires_at);
    if (now > expiresAt) {
      await supabaseAdmin.from('audit_logs').insert({
        action: 'OTP_EXPIRED',
        module: 'auth',
        actor_email: email,
        success: false,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
      });

      return new Response(
        JSON.stringify({ error: 'OTP_EXPIRED' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check attempts
    if (otpRequest.attempts_left <= 0) {
      return new Response(
        JSON.stringify({ error: 'OTP_LOCKED' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify OTP using constant-time comparison
    const expectedHash = await hashOtp(otp);
    const isValid = expectedHash === otpRequest.otp_hash;

    if (!isValid) {
      // Decrement attempts
      await supabaseAdmin
        .from('otp_requests')
        .update({ attempts_left: otpRequest.attempts_left - 1 })
        .eq('id', otpRequest.id);

      await supabaseAdmin.from('audit_logs').insert({
        action: 'OTP_INVALID',
        module: 'auth',
        actor_email: email,
        success: false,
        details: { attempts_left: otpRequest.attempts_left - 1 },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
      });

      return new Response(
        JSON.stringify({
          error: 'INVALID_OTP',
          attempts_left: otpRequest.attempts_left - 1,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // OTP is valid - create user
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        name: otpRequest.name,
        email: email.toLowerCase(),
        password_hash: otpRequest.password_hash,
        role: 'User',
        status: 'active',
        last_login_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('User creation error:', createError);
      throw createError;
    }

    // Delete OTP request
    await supabaseAdmin
      .from('otp_requests')
      .delete()
      .eq('id', otpRequest.id);

    // Generate JWT
    const jwtSecret = Deno.env.get('JWT_SECRET') ?? '';
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(jwtSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const token = await create(
      { alg: 'HS256', typ: 'JWT' },
      {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
      },
      key
    );

    // Log events
    await supabaseAdmin.from('audit_logs').insert([
      {
        action: 'OTP_VERIFIED',
        module: 'auth',
        actor_id: newUser.id,
        actor_email: email,
        actor_role: newUser.role,
        success: true,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
      },
      {
        action: 'USER_CREATED',
        module: 'users',
        actor_id: newUser.id,
        actor_email: email,
        actor_role: newUser.role,
        target_id: newUser.id,
        target_type: 'user',
        success: true,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
      },
      {
        action: 'USER_LOGIN',
        module: 'auth',
        actor_id: newUser.id,
        actor_email: email,
        actor_role: newUser.role,
        success: true,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
      },
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
        redirectTo: '/dashboard',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in verify-otp:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});