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
          <h1>Slate AI – Email Verification</h1>
          <p>Your OTP for email verification is:</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          <p>This OTP will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>
          <div class="warning">
            <strong>Security Notice:</strong> Never share this OTP with anyone. Slate AI will never ask for your OTP via phone or email.
          </div>
        </div>
      </body>
    </html>
  `;

  await supabase.functions.invoke('send-email', {
    body: { to: email, subject: 'Slate AI – OTP Verification', html },
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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { action, otp, newEmail } = await req.json();

    // Step 1: Send OTP to current email
    if (action === 'send-old-otp') {
      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('id', user.id)
        .single();

      if (!userData) {
        throw new Error('User not found');
      }

      const otpCode = generateOTP();
      const otpHash = await bcrypt.hash(otpCode);
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
      const resendAfter = new Date(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);

      // Delete any existing requests
      await supabase
        .from('email_change_requests')
        .delete()
        .eq('user_id', user.id);

      // Create new request
      const { error: insertError } = await supabase
        .from('email_change_requests')
        .insert({
          user_id: user.id,
          old_email: userData.email,
          old_email_otp_hash: otpHash,
          status: 'verifying_old',
          attempts_left: MAX_ATTEMPTS,
          expires_at: expiresAt.toISOString(),
          resend_after: resendAfter.toISOString(),
        });

      if (insertError) throw insertError;

      await sendOTPEmail(userData.email, otpCode, supabase);

      // Audit log
      await supabase.from('audit_logs').insert({
        action: 'EMAIL_CHANGE_OLD_OTP_SENT',
        module: 'profile',
        actor_id: user.id,
        actor_email: userData.email,
        success: true,
      });

      return new Response(
        JSON.stringify({ success: true, message: 'OTP sent to current email' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Verify OTP from current email
    if (action === 'verify-old-otp') {
      const { data: request } = await supabase
        .from('email_change_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'verifying_old')
        .single();

      if (!request) {
        return new Response(
          JSON.stringify({ error: 'No active email change request found' }),
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

      const isValid = await bcrypt.compare(otp, request.old_email_otp_hash);

      if (!isValid) {
        await supabase
          .from('email_change_requests')
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

      // Update status to verifying_new
      await supabase
        .from('email_change_requests')
        .update({ status: 'verifying_new' })
        .eq('id', request.id);

      // Audit log
      await supabase.from('audit_logs').insert({
        action: 'EMAIL_CHANGE_OLD_OTP_VERIFIED',
        module: 'profile',
        actor_id: user.id,
        success: true,
      });

      return new Response(
        JSON.stringify({ success: true, message: 'Old email verified' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Send OTP to new email
    if (action === 'send-new-otp') {
      if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        return new Response(
          JSON.stringify({ error: 'Invalid email address' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', newEmail)
        .single();

      if (existingUser) {
        return new Response(
          JSON.stringify({ error: 'Email already in use' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: request } = await supabase
        .from('email_change_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'verifying_new')
        .single();

      if (!request) {
        return new Response(
          JSON.stringify({ error: 'Please verify your current email first' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const otpCode = generateOTP();
      const otpHash = await bcrypt.hash(otpCode);
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
      const resendAfter = new Date(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);

      await supabase
        .from('email_change_requests')
        .update({
          new_email: newEmail,
          new_email_otp_hash: otpHash,
          attempts_left: MAX_ATTEMPTS,
          expires_at: expiresAt.toISOString(),
          resend_after: resendAfter.toISOString(),
        })
        .eq('id', request.id);

      await sendOTPEmail(newEmail, otpCode, supabase);

      // Audit log
      await supabase.from('audit_logs').insert({
        action: 'EMAIL_CHANGE_NEW_OTP_SENT',
        module: 'profile',
        actor_id: user.id,
        success: true,
        details: { new_email: newEmail },
      });

      return new Response(
        JSON.stringify({ success: true, message: 'OTP sent to new email' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Verify new email OTP and update
    if (action === 'confirm') {
      const { data: request } = await supabase
        .from('email_change_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'verifying_new')
        .single();

      if (!request || !request.new_email_otp_hash) {
        return new Response(
          JSON.stringify({ error: 'No active email change request found' }),
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

      const isValid = await bcrypt.compare(otp, request.new_email_otp_hash);

      if (!isValid) {
        await supabase
          .from('email_change_requests')
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

      // Update user email
      const { error: updateError } = await supabase
        .from('users')
        .update({ email: request.new_email })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Mark request as completed
      await supabase
        .from('email_change_requests')
        .update({ status: 'completed' })
        .eq('id', request.id);

      // Audit log
      await supabase.from('audit_logs').insert({
        action: 'EMAIL_CHANGED',
        module: 'profile',
        actor_id: user.id,
        actor_email: request.new_email,
        success: true,
        details: { old_email: request.old_email, new_email: request.new_email },
      });

      return new Response(
        JSON.stringify({ success: true, message: 'Email updated successfully', email: request.new_email }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in change-email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});