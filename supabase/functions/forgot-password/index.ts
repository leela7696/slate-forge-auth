import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OTP_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(email: string, otp: string, supabase: any) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .otp-box { background: #f4f4f4; border: 2px solid #ddd; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 4px; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Slate AI – Password Reset</h1>
          <p>Your OTP for password reset is:</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          <p>This OTP will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>
          <div class="warning">
            <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email and secure your account immediately.
          </div>
        </div>
      </body>
    </html>
  `;

  await supabase.functions.invoke('send-email', {
    body: { to: email, subject: 'Slate AI – Password Reset OTP', html },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, email, otp, newPassword } = await req.json();

    // Step 1: Send OTP
    if (action === 'send-otp') {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return new Response(
          JSON.stringify({ error: 'Invalid email address' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: userData } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email)
        .single();

      if (!userData) {
        // Don't reveal if user exists for security
        return new Response(
          JSON.stringify({ success: true, message: 'If the email exists, an OTP has been sent' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const otpCode = generateOTP();
      const otpHash = await bcrypt.hash(otpCode);
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
      const resendAfter = new Date(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);

      // Delete any existing requests
      await supabase
        .from('password_change_requests')
        .delete()
        .eq('user_id', userData.id);

      // Create new request
      const { error: insertError } = await supabase
        .from('password_change_requests')
        .insert({
          user_id: userData.id,
          email: userData.email,
          otp_hash: otpHash,
          attempts_left: MAX_ATTEMPTS,
          expires_at: expiresAt.toISOString(),
          resend_after: resendAfter.toISOString(),
        });

      if (insertError) throw insertError;

      await sendOTPEmail(userData.email, otpCode, supabase);

      // Audit log
      await supabase.from('audit_logs').insert({
        action: 'PASSWORD_RESET_REQUESTED',
        module: 'auth',
        actor_email: userData.email,
        success: true,
      });

      return new Response(
        JSON.stringify({ success: true, message: 'OTP sent to your email' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Verify OTP and reset password
    if (action === 'reset') {
      if (!email || !otp || !newPassword) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (newPassword.length < 6) {
        return new Response(
          JSON.stringify({ error: 'Password must be at least 6 characters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (!userData) {
        return new Response(
          JSON.stringify({ error: 'Invalid request' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: request } = await supabase
        .from('password_change_requests')
        .select('*')
        .eq('user_id', userData.id)
        .eq('email', email)
        .single();

      if (!request) {
        return new Response(
          JSON.stringify({ error: 'No active password reset request found' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (new Date(request.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'OTP expired' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (request.attempts_left <= 0) {
        return new Response(
          JSON.stringify({ error: 'Maximum attempts exceeded' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const isValid = await bcrypt.compare(otp, request.otp_hash);

      if (!isValid) {
        await supabase
          .from('password_change_requests')
          .update({ attempts_left: request.attempts_left - 1 })
          .eq('id', request.id);

        return new Response(
          JSON.stringify({ 
            error: 'Invalid OTP', 
            attemptsLeft: request.attempts_left - 1 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword);

      // Update user password
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: passwordHash })
        .eq('id', userData.id);

      if (updateError) throw updateError;

      // Delete the request
      await supabase
        .from('password_change_requests')
        .delete()
        .eq('id', request.id);

      // Audit log
      await supabase.from('audit_logs').insert({
        action: 'PASSWORD_RESET_COMPLETED',
        module: 'auth',
        actor_email: email,
        success: true,
      });

      return new Response(
        JSON.stringify({ success: true, message: 'Password reset successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in forgot-password:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});