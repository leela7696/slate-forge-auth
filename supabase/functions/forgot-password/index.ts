import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

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

// Hash password using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sendOTPEmail(email: string, otp: string) {
  const client = new SMTPClient({
    connection: {
      hostname: Deno.env.get('SMTP_HOST') ?? '', port: parseInt(Deno.env.get('SMTP_PORT') ?? '587'), tls: true,
      auth: { username: Deno.env.get('SMTP_USER') ?? '', password: Deno.env.get('SMTP_PASS') ?? '' },
    },
  });

  await client.send({
    from: Deno.env.get('SMTP_FROM') ?? 'Slate AI <no-reply@slateai.com>',
    to: email, subject: 'Slate AI – Password Reset OTP',
    html: `<div style="font-family:Arial;padding:20px;max-width:600px;margin:0 auto"><h1>Password Reset</h1><p>Your OTP:</p><div style="background:#f4f4f4;padding:20px;text-align:center;margin:20px 0"><div style="font-size:32px;font-weight:bold;color:#2563eb;letter-spacing:4px">${otp}</div></div><p>Expires in ${OTP_EXPIRY_MINUTES} minutes.</p></div>`,
  });
  await client.close();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { action, email, otp, newPassword } = await req.json();

    if (action === 'send-otp') {
      if (!email) throw new Error('Email required');

      const { data: user } = await supabase.from('users').select('id, email, status').eq('email', email.toLowerCase()).maybeSingle();
      if (!user || user.status !== 'active') {
        return new Response(JSON.stringify({ error: 'User not found' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const otpCode = generateOTP();
      await supabase.from('password_change_requests').delete().eq('email', email.toLowerCase());
      await supabase.from('password_change_requests').insert({
        user_id: user.id, email: email.toLowerCase(), otp_hash: await hashOtp(otpCode),
        attempts_left: MAX_ATTEMPTS,
        expires_at: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000).toISOString(),
        resend_after: new Date(Date.now() + RESEND_COOLDOWN_SECONDS * 1000).toISOString(),
      });

      await sendOTPEmail(email, otpCode);
      return new Response(JSON.stringify({ success: true, message: 'OTP sent' }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'reset') {
      if (!email || !otp || !newPassword) {
        return new Response(JSON.stringify({ error: 'Email, OTP, and new password required' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (newPassword.length < 6) {
        return new Response(JSON.stringify({ error: 'Password must be 6+ characters' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const { data: request } = await supabase.from('password_change_requests').select('*').eq('email', email.toLowerCase()).single();
      if (!request || new Date(request.expires_at) < new Date() || request.attempts_left <= 0) {
        return new Response(JSON.stringify({ error: 'Invalid or expired request' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const expectedHash = await hashOtp(otp);
      if (expectedHash !== request.otp_hash) {
        await supabase.from('password_change_requests').update({ attempts_left: request.attempts_left - 1 }).eq('id', request.id);
        return new Response(JSON.stringify({ error: 'Invalid OTP' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      await supabase.from('users').update({ password_hash: await hashPassword(newPassword) }).eq('id', request.user_id);
      await supabase.from('password_change_requests').delete().eq('id', request.id);
      return new Response(JSON.stringify({ success: true, message: 'Password reset successful' }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
