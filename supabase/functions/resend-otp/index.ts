import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResendOtpRequest {
  email: string;
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
    const { email }: ResendOtpRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if there's an existing OTP request
    const { data: existingRequest, error: fetchError } = await supabaseAdmin
      .from('otp_requests')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (fetchError || !existingRequest) {
      return new Response(
        JSON.stringify({ error: 'No signup request found. Please start signup again.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate new 6-digit OTP
    const otpLength = parseInt(Deno.env.get('OTP_LENGTH') || '6');
    const otp = Math.floor(100000 + Math.random() * 900000).toString().slice(0, otpLength);

    // Hash OTP with HMAC
    const otpHash = await hashOtp(otp);

    // Calculate new expiry and resend times
    const expiryMinutes = parseInt(Deno.env.get('OTP_EXPIRY_MINUTES') || '10');
    const resendCooldown = parseInt(Deno.env.get('OTP_RESEND_COOLDOWN_SECONDS') || '60');
    const maxAttempts = parseInt(Deno.env.get('OTP_MAX_ATTEMPTS') || '5');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiryMinutes * 60000);
    const resendAfter = new Date(now.getTime() + resendCooldown * 1000);

    // Update OTP request with new OTP
    const { error: updateError } = await supabaseAdmin
      .from('otp_requests')
      .update({
        otp_hash: otpHash,
        attempts_left: maxAttempts,
        expires_at: expiresAt.toISOString(),
        resend_after: resendAfter.toISOString(),
      })
      .eq('email', email.toLowerCase());

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
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

    // Log OTP resent
    await supabaseAdmin.from('audit_logs').insert({
      action: 'OTP_RESENT',
      module: 'auth',
      actor_email: email,
      success: true,
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
    });

    console.log(`OTP resent to ${email}: ${otp}`);

    return new Response(
      JSON.stringify({
        success: true,
        resend_after_seconds: resendCooldown,
        expires_in_minutes: expiryMinutes,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in resend-otp:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
