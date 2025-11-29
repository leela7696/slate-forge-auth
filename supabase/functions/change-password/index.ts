import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
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

async function verifyToken(token: string) {
  const jwtSecret = Deno.env.get('JWT_SECRET') ?? '';
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(jwtSecret), 
    { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  return await verify(token, key);
}

async function sendOTPEmail(supabase: any, email: string, otp: string, name?: string) {
  await supabase.functions.invoke('send-email', {
    body: {
      to: email,
      subject: 'Your Slate AI verification code',
      template: 'otp_verification',
      variables: {
        user_name: name || 'there',
        otp,
        app_name: Deno.env.get('APP_NAME') || 'Slate AI',
        support_email: Deno.env.get('SUPPORT_EMAIL') || 'support@slate.ai',
        dashboard_url: Deno.env.get('APP_DASHBOARD_URL') || 'https://app.slate.ai',
      },
    },
  });
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

    const { action, otp, newPassword } = await req.json();

    if (action === 'send-otp') {
      const { data: userData } = await supabase.from('users').select('email, name').eq('id', userId).single();
      if (!userData) throw new Error('User not found');

      const otpCode = generateOTP();
      await supabase.from('password_change_requests').delete().eq('user_id', userId);
      await supabase.from('password_change_requests').insert({
        user_id: userId, email: userData.email, otp_hash: await hashOtp(otpCode),
        attempts_left: MAX_ATTEMPTS,
        expires_at: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000).toISOString(),
        resend_after: new Date(Date.now() + RESEND_COOLDOWN_SECONDS * 1000).toISOString(),
      });

      await sendOTPEmail(supabase, userData.email, otpCode, userData.name);
      return new Response(JSON.stringify({ success: true, message: 'OTP sent' }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'verify-and-update') {
      if (!newPassword || newPassword.length < 6) {
        return new Response(JSON.stringify({ error: 'Password must be 6+ characters' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const { data: request } = await supabase.from('password_change_requests').select('*').eq('user_id', userId).single();
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

      await supabase.from('users').update({ password_hash: await hashPassword(newPassword) }).eq('id', userId);
      await supabase.from('password_change_requests').delete().eq('id', request.id);
      // Send confirmation email
      const { data: updatedUser } = await supabase.from('users').select('email, name').eq('id', userId).single();
      if (updatedUser?.email) {
        await supabase.functions.invoke('send-email', {
          body: {
            to: updatedUser.email,
            subject: 'Your password has been changed',
            template: 'password_change_confirmation',
            variables: {
              user_name: updatedUser.name || 'there',
              app_name: Deno.env.get('APP_NAME') || 'Slate AI',
              support_email: Deno.env.get('SUPPORT_EMAIL') || 'support@slate.ai',
              dashboard_url: Deno.env.get('APP_DASHBOARD_URL') || 'https://app.slate.ai',
            },
          },
        });
      }
      return new Response(JSON.stringify({ success: true, message: 'Password updated' }), 
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
