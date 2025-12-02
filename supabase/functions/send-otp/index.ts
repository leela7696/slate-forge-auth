import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendOtpRequest {
  name: string;
  email: string;
  password: string;
}

// Hash password using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Hash OTP using HMAC with secret
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
    const { name: rawName, email: rawEmail, password: rawPassword }: SendOtpRequest = await req.json();

    // Trim inputs
    const name = (rawName || '').trim();
    const email = (rawEmail || '').trim();
    const password = rawPassword || '';

    // Validate inputs
    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Name, email, and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Email regex validation
    const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!EMAIL_REGEX.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Strong password validation
    const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    if (!STRONG_PASSWORD_REGEX.test(password)) {
      return new Response(
        JSON.stringify({ error: 'Weak password' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if email already exists (excluding deleted users)
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, status')
      .eq('email', email.toLowerCase())
      .eq('is_deleted', false)
      .maybeSingle();

    if (existingUser && existingUser.status === 'active') {
      return new Response(
        JSON.stringify({ error: 'Email already registered' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate 6-digit OTP
    const otpLength = parseInt(Deno.env.get('OTP_LENGTH') || '6');
    const otp = Math.floor(100000 + Math.random() * 900000).toString().slice(0, otpLength);

    // Hash OTP with HMAC
    const otpHash = await hashOtp(otp);

    // Hash password
    const passwordHash = await hashPassword(password);

    // Calculate expiry and resend times
    const expiryMinutes = parseInt(Deno.env.get('OTP_EXPIRY_MINUTES') || '10');
    const resendCooldown = parseInt(Deno.env.get('OTP_RESEND_COOLDOWN_SECONDS') || '60');
    const maxAttempts = parseInt(Deno.env.get('OTP_MAX_ATTEMPTS') || '5');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiryMinutes * 60000);
    const resendAfter = new Date(now.getTime() + resendCooldown * 1000);

    // Delete any existing OTP request for this email
    await supabaseAdmin
      .from('otp_requests')
      .delete()
      .eq('email', email.toLowerCase());

    // Store OTP request
    const { error: insertError } = await supabaseAdmin
      .from('otp_requests')
      .insert({
        email: email.toLowerCase(),
        name,
        password_hash: passwordHash,
        otp_hash: otpHash,
        attempts_left: maxAttempts,
        expires_at: expiresAt.toISOString(),
        resend_after: resendAfter.toISOString(),
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    // Send OTP via email using template
    const { data: emailData, error: emailError } = await supabaseAdmin.functions.invoke('send-email', {
      body: {
        to: email,
        subject: 'Your Slate AI verification code',
        template: 'otp_verification',
        variables: {
          user_name: name,
          otp,
          app_name: Deno.env.get('APP_NAME') || 'Slate AI',
          support_email: Deno.env.get('SUPPORT_EMAIL') || 'support@slate.ai',
          dashboard_url: Deno.env.get('APP_DASHBOARD_URL') || 'https://app.slate.ai',
        },
      },
    });

    if (emailError) {
      console.error('Email send failed:', emailError);
      
      // Log failure in audit log
      await supabaseAdmin.from('audit_logs').insert({
        action: 'SMTP_SEND_FAILED',
        module: 'auth',
        actor_email: email,
        success: false,
        details: { error: emailError.message },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
      });
      
      throw new Error('Failed to send OTP email. Please check your SMTP configuration.');
    }

    // Log OTP sent
    await supabaseAdmin.from('audit_logs').insert({
      action: 'OTP_SENT',
      module: 'auth',
      actor_email: email,
      success: true,
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
    });

    console.log(`OTP sent to ${email}: ${otp}`); // For development only

    return new Response(
      JSON.stringify({
        success: true,
        resend_after_seconds: resendCooldown,
        expires_in_minutes: expiryMinutes,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in send-otp:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
