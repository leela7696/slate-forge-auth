import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendOtpRequest {
  name: string;
  email: string;
  password: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, password }: SendOtpRequest = await req.json();

    // Validate inputs
    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Name, email, and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, status')
      .eq('email', email.toLowerCase())
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

    // Hash OTP with bcrypt
    const otpHash = await bcrypt.hash(otp);

    // Hash password temporarily
    const passwordHash = await bcrypt.hash(password);

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

    // Send OTP via email
    const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
      },
      body: JSON.stringify({
        to: email,
        subject: 'Your Slate AI verification code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e293b;">Welcome to Slate AI</h2>
            <p>Your verification code is:</p>
            <div style="background: #f1f5f9; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0f172a;">${otp}</span>
            </div>
            <p style="color: #64748b;">This code expires in ${expiryMinutes} minutes.</p>
            <p style="color: #64748b; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const emailError = await emailResponse.text();
      console.error('Email send failed:', emailError);
      
      // Log failure in audit log
      await supabaseAdmin.from('audit_logs').insert({
        action: 'SMTP_SEND_FAILED',
        module: 'auth',
        actor_email: email,
        success: false,
        details: { error: emailError },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
      });
      
      throw new Error('Failed to send OTP email');
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