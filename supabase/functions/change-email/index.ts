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

async function verifyToken(token: string) {
  const jwtSecret = Deno.env.get('JWT_SECRET') ?? '';
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(jwtSecret), 
    { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  return await verify(token, key);
}

async function sendOTPEmail(supabase: any, email: string, otp: string, isOldEmail: boolean, name?: string) {
  const subject = isOldEmail ? 'Verify your current email' : 'Verify your new email';
  await supabase.functions.invoke('send-email', {
    body: {
      to: email,
      subject: `Slate AI – ${subject}`,
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

    const { action, newEmail, otp } = await req.json();

    if (action === 'send-old-otp') {
      console.log('Sending old OTP for userId:', userId);
      
      const { data: userData } = await supabase.from('users').select('email, name').eq('id', userId).single();
      if (!userData) {
        console.error('User not found:', userId);
        throw new Error('User not found');
      }
      
      console.log('User email:', userData.email);

      const oldOtpCode = generateOTP();

      const { error: deleteError } = await supabase.from('email_change_requests').delete().eq('user_id', userId);
      if (deleteError) console.error('Error deleting old requests:', deleteError);
      
      const { data: insertedData, error: insertError } = await supabase.from('email_change_requests').insert({
        user_id: userId, 
        old_email: userData.email, 
        new_email: '',
        old_email_otp_hash: await hashOtp(oldOtpCode), 
        new_email_otp_hash: '',
        status: 'verifying_old',
        attempts_left: MAX_ATTEMPTS,
        expires_at: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000).toISOString(),
        resend_after: new Date(Date.now() + RESEND_COOLDOWN_SECONDS * 1000).toISOString(),
      }).select();
      
      if (insertError) {
        console.error('Error inserting email change request:', insertError);
        throw new Error('Failed to create email change request');
      }
      
      console.log('Email change request created:', insertedData);

      await sendOTPEmail(supabase, userData.email, oldOtpCode, true, userData.name);
      return new Response(JSON.stringify({ success: true, message: 'OTP sent to current email' }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'verify-old-otp') {
      if (!otp) throw new Error('OTP required');

      console.log('Verifying old OTP for userId:', userId);
      
      const { data: request, error: fetchError } = await supabase
        .from('email_change_requests')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      console.log('Fetched request:', request ? 'Found' : 'Not found', fetchError ? `Error: ${fetchError.message}` : '');
      
      if (!request) {
        console.error('No email change request found for user:', userId);
        return new Response(JSON.stringify({ error: 'No email change request found. Please try again.' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      if (new Date(request.expires_at) < new Date()) {
        console.error('Request expired:', request.expires_at);
        return new Response(JSON.stringify({ error: 'OTP expired. Please request a new one.' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      if (request.attempts_left <= 0) {
        console.error('No attempts left');
        return new Response(JSON.stringify({ error: 'Too many failed attempts. Please request a new OTP.' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const expectedHash = await hashOtp(otp);
      if (expectedHash !== request.old_email_otp_hash) {
        await supabase.from('email_change_requests').update({ attempts_left: request.attempts_left - 1 }).eq('id', request.id);
        return new Response(JSON.stringify({ error: 'Invalid OTP' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      await supabase.from('email_change_requests').update({ status: 'verifying_new' }).eq('id', request.id);
      return new Response(JSON.stringify({ success: true, message: 'Current email verified' }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'send-new-otp') {
      if (!newEmail) throw new Error('New email required');

      const { data: existingUser } = await supabase.from('users').select('id').eq('email', newEmail.toLowerCase()).neq('id', userId).maybeSingle();
      if (existingUser) {
        return new Response(JSON.stringify({ error: 'Email already in use' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const { data: request } = await supabase.from('email_change_requests').select('*').eq('user_id', userId).single();
      if (!request || request.status !== 'verifying_new') {
        return new Response(JSON.stringify({ error: 'Please verify current email first' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const newOtpCode = generateOTP();
      await supabase.from('email_change_requests').update({ 
        new_email: newEmail.toLowerCase(),
        new_email_otp_hash: await hashOtp(newOtpCode),
        status: 'verifying_new',
        attempts_left: MAX_ATTEMPTS,
        expires_at: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000).toISOString(),
        resend_after: new Date(Date.now() + RESEND_COOLDOWN_SECONDS * 1000).toISOString(),
      }).eq('id', request.id);
      
      await sendOTPEmail(supabase, newEmail, newOtpCode, false);
      return new Response(JSON.stringify({ success: true, message: 'OTP sent to new email' }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'confirm') {
      if (!otp) throw new Error('OTP required');

      const { data: request } = await supabase.from('email_change_requests').select('*').eq('user_id', userId).single();
      if (!request || request.status !== 'verifying_new' || new Date(request.expires_at) < new Date() || request.attempts_left <= 0) {
        return new Response(JSON.stringify({ error: 'Invalid or expired request' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const expectedHash = await hashOtp(otp);
      if (expectedHash !== request.new_email_otp_hash) {
        await supabase.from('email_change_requests').update({ attempts_left: request.attempts_left - 1 }).eq('id', request.id);
        return new Response(JSON.stringify({ error: 'Invalid OTP' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      await supabase.from('users').update({ email: request.new_email }).eq('id', userId);
      await supabase.from('email_change_requests').delete().eq('id', request.id);

      // Send email change confirmation
      const { data: userData } = await supabase.from('users').select('name, email').eq('id', userId).single();
      if (userData?.email) {
        await supabase.functions.invoke('send-email', {
          body: {
            to: userData.email,
            subject: 'Your email has been updated',
            template: 'email_change_confirmation',
            variables: {
              user_name: userData.name || 'there',
              app_name: Deno.env.get('APP_NAME') || 'Slate AI',
              support_email: Deno.env.get('SUPPORT_EMAIL') || 'support@slate.ai',
              dashboard_url: Deno.env.get('APP_DASHBOARD_URL') || 'https://app.slate.ai',
            },
          },
        });
      }
      return new Response(JSON.stringify({ success: true, message: 'Email updated successfully' }), 
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
