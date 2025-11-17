import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { verify } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

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

async function sendOTPEmail(email: string, otp: string) {
  const client = new SMTPClient({
    connection: {
      hostname: Deno.env.get('SMTP_HOST') ?? '',
      port: parseInt(Deno.env.get('SMTP_PORT') ?? '587'),
      tls: true,
      auth: {
        username: Deno.env.get('SMTP_USER') ?? '',
        password: Deno.env.get('SMTP_PASS') ?? '',
      },
    },
  });

  await client.send({
    from: Deno.env.get('SMTP_FROM') ?? 'Slate AI <no-reply@slateai.com>',
    to: email,
    subject: 'Slate AI – OTP Verification',
    html: `<div style="font-family:Arial;padding:20px;max-width:600px;margin:0 auto"><h1>Email Verification</h1><p>Your OTP:</p><div style="background:#f4f4f4;padding:20px;text-align:center;margin:20px 0"><div style="font-size:32px;font-weight:bold;color:#2563eb;letter-spacing:4px">${otp}</div></div><p>Expires in ${OTP_EXPIRY_MINUTES} minutes.</p></div>`,
  });

  await client.close();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const payload = await verifyToken(authHeader.replace('Bearer ', ''));
    const userId = payload.userId as string;
    if (!userId) throw new Error('Invalid token');

    const { action, otp, newEmail } = await req.json();

    if (action === 'send-old-otp') {
      const { data: userData } = await supabase.from('users').select('email').eq('id', userId).single();
      if (!userData) throw new Error('User not found');

      const otpCode = generateOTP();
      await supabase.from('email_change_requests').delete().eq('user_id', userId);
      await supabase.from('email_change_requests').insert({
        user_id: userId, old_email: userData.email, old_email_otp_hash: await bcrypt.hash(otpCode),
        status: 'verifying_old', attempts_left: MAX_ATTEMPTS,
        expires_at: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000).toISOString(),
        resend_after: new Date(Date.now() + RESEND_COOLDOWN_SECONDS * 1000).toISOString(),
      });

      await sendOTPEmail(userData.email, otpCode);
      await supabase.from('audit_logs').insert({
        action: 'EMAIL_CHANGE_OLD_OTP_SENT', module: 'profile', actor_id: userId, success: true,
      });

      return new Response(JSON.stringify({ success: true, message: 'OTP sent' }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'verify-old-otp') {
      const { data: request } = await supabase.from('email_change_requests')
        .select('*').eq('user_id', userId).eq('status', 'verifying_old').single();

      if (!request || new Date(request.expires_at) < new Date() || request.attempts_left <= 0) {
        return new Response(JSON.stringify({ error: 'Invalid or expired request' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (!await bcrypt.compare(otp, request.old_email_otp_hash)) {
        await supabase.from('email_change_requests').update({ attempts_left: request.attempts_left - 1 }).eq('id', request.id);
        return new Response(JSON.stringify({ error: 'Invalid OTP' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      await supabase.from('email_change_requests').update({ status: 'verifying_new' }).eq('id', request.id);
      return new Response(JSON.stringify({ success: true }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'send-new-otp') {
      if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        return new Response(JSON.stringify({ error: 'Invalid email' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const { data: existing } = await supabase.from('users').select('id').eq('email', newEmail).single();
      if (existing) return new Response(JSON.stringify({ error: 'Email in use' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const { data: request } = await supabase.from('email_change_requests')
        .select('*').eq('user_id', userId).eq('status', 'verifying_new').single();
      if (!request) return new Response(JSON.stringify({ error: 'Verify current email first' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const otpCode = generateOTP();
      await supabase.from('email_change_requests').update({
        new_email: newEmail, new_email_otp_hash: await bcrypt.hash(otpCode), attempts_left: MAX_ATTEMPTS,
        expires_at: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000).toISOString(),
      }).eq('id', request.id);

      await sendOTPEmail(newEmail, otpCode);
      return new Response(JSON.stringify({ success: true }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'confirm') {
      const { data: request } = await supabase.from('email_change_requests')
        .select('*').eq('user_id', userId).eq('status', 'verifying_new').single();

      if (!request || !request.new_email_otp_hash || new Date(request.expires_at) < new Date() || request.attempts_left <= 0) {
        return new Response(JSON.stringify({ error: 'Invalid or expired request' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (!await bcrypt.compare(otp, request.new_email_otp_hash)) {
        await supabase.from('email_change_requests').update({ attempts_left: request.attempts_left - 1 }).eq('id', request.id);
        return new Response(JSON.stringify({ error: 'Invalid OTP' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      await supabase.from('users').update({ email: request.new_email }).eq('id', userId);
      await supabase.from('email_change_requests').update({ status: 'completed' }).eq('id', request.id);
      return new Response(JSON.stringify({ success: true, email: request.new_email }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), 
      { status: error.message.includes('JWT') ? 401 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});