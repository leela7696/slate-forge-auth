import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function verifyToken(token: string) {
  const secret = Deno.env.get('JWT_SECRET');
  if (!secret) throw new Error('JWT_SECRET not configured');

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const [headerB64, payloadB64, signatureB64] = token.split('.');
  const data = encoder.encode(`${headerB64}.${payloadB64}`);
  
  const signatureBytes = Uint8Array.from(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  
  const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, data);
  
  if (!isValid) throw new Error('Invalid token signature');
  
  const payload = JSON.parse(atob(payloadB64));
  
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    throw new Error('Token expired');
  }
  
  return payload;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = await verifyToken(token);
    const userId = payload.userId;

    if (!userId) {
      throw new Error('Invalid token payload');
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const formData = await req.formData();
    const action = formData.get('action') as string;

    if (action === 'delete') {
      const filePath = formData.get('filePath') as string;
      
      if (!filePath) {
        throw new Error('Missing file path');
      }

      // Delete the file
      const { error: deleteError } = await supabase.storage
        .from('profile-pictures')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_picture_url: null, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (updateError) throw updateError;

      console.log(`Profile picture deleted for user ${userId}`);

      return new Response(
        JSON.stringify({ success: true, url: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upload action
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    // Get old profile picture URL to delete it
    const { data: userData } = await supabase
      .from('users')
      .select('profile_picture_url')
      .eq('id', userId)
      .single();

    // Delete old profile picture if exists
    if (userData?.profile_picture_url) {
      const oldPath = userData.profile_picture_url.split('/').slice(-2).join('/');
      await supabase.storage.from('profile-pictures').remove([oldPath]);
    }

    // Create file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    // Upload new file
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(uploadData.path);

    const publicUrl = urlData.publicUrl;

    // Update user profile
    const { error: updateError } = await supabase
      .from('users')
      .update({ profile_picture_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) throw updateError;

    console.log(`Profile picture uploaded for user ${userId}`);

    return new Response(
      JSON.stringify({ success: true, url: publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in upload-profile-picture:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
