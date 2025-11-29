// Helper to send emails using the send-email edge function
// Provides a reusable API: sendEmail(templateName, variables)

import { TemplateName, TemplateVars } from './emailTemplates.ts';

export interface SendEmailParams {
  to: string;
  subject: string;
  template: TemplateName;
  variables: TemplateVars;
}

// The public URL of the Supabase project must be available via env
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SEND_EMAIL_ENDPOINT = `${SUPABASE_URL}/functions/v1/send-email`;

export async function sendEmail(params: SendEmailParams): Promise<Response> {
  const { to, subject, template, variables } = params;
  const resp = await fetch(SEND_EMAIL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || ''}`,
    },
    body: JSON.stringify({ to, subject, template, variables }),
  });
  return resp;
}

