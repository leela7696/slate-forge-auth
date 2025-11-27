// Type shims for local TypeScript tooling; Deno provides these at runtime.
declare const Deno: {
  env: { get(name: string): string | undefined };
};

/* @ts-expect-error Remote Deno import */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
/* @ts-expect-error Remote Deno import */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
/* @ts-expect-error Remote Deno import */
import { create } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LoginRequest {
  email: string;
  password: string;
}

// Hash password using Web Crypto API (same as send-otp)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password }: LoginRequest = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find user (check exists first)
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_deleted', false)
      .maybeSingle();

    // Check if user is inactive
    if (existingUser && existingUser.status !== 'active') {
      await supabaseAdmin.from('audit_logs').insert({
        action: 'USER_LOGIN_FAILED',
        module: 'auth',
        actor_id: existingUser.id,
        actor_email: email,
        actor_role: existingUser.role,
        success: false,
        details: { reason: 'account_inactive' },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
      });

      return new Response(
        JSON.stringify({ error: 'Your account has been deactivated. Please contact an administrator.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If user not found or not active
    if (!existingUser) {
      await supabaseAdmin.from('audit_logs').insert({
        action: 'USER_LOGIN_FAILED',
        module: 'auth',
        actor_email: email,
        success: false,
        details: { reason: 'user_not_found' },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
      });

      return new Response(
        JSON.stringify({ error: 'wrong password. re-enter the password.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const user = existingUser;

    // Verify password using constant-time comparison
    const hashedInputPassword = await hashPassword(password);
    const isValidPassword = hashedInputPassword === user.password_hash;

    if (!isValidPassword) {
      await supabaseAdmin.from('audit_logs').insert({
        action: 'USER_LOGIN_FAILED',
        module: 'auth',
        actor_id: user.id,
        actor_email: email,
        actor_role: user.role,
        success: false,
        details: { reason: 'invalid_password' },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
      });

      return new Response(
        JSON.stringify({ error: 'wrong password. re-enter the password.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update last login
    await supabaseAdmin
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

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
        userId: user.id,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
      },
      key
    );

    // Log successful login
    await supabaseAdmin.from('audit_logs').insert({
      action: 'USER_LOGIN',
      module: 'auth',
      actor_id: user.id,
      actor_email: email,
      actor_role: user.role,
      success: true,
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
    });

    return new Response(
      JSON.stringify({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          department: user.department,
          profile_picture_url: user.profile_picture_url,
          created_at: user.created_at,
        },
        redirectTo: '/dashboard',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in login:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
