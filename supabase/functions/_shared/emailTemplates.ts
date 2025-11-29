// Reusable Slate AI branded email templates
// Supports dynamic variables via simple {{placeholder}} replacement

export type TemplateName =
  | 'otp_verification'
  | 'password_change_confirmation'
  | 'email_change_confirmation'
  | 'role_change_notification'
  | 'welcome_email';

export type TemplateVars = {
  user_name?: string;
  otp?: string;
  support_email?: string;
  app_name?: string;
  role_old?: string;
  role_new?: string;
  dashboard_url?: string;
};

const baseStyles = {
  body: 'margin:0;padding:0;background:#f5f7fb;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;',
  container: 'max-width:600px;margin:0 auto;padding:24px;',
  card: 'background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 2px 8px rgba(15,23,42,0.08);',
  header: 'display:flex;align-items:center;gap:12px;margin-bottom:24px;',
  logo: 'height:28px;width:auto;display:inline-block;',
  brand: 'font-weight:600;color:#0f172a;font-size:16px;letter-spacing:0.2px;',
  h1: 'margin:0 0 8px 0;color:#0f172a;font-size:22px;line-height:1.3;',
  subtitle: 'margin:0 0 16px 0;color:#334155;font-size:15px;line-height:1.5;',
  otp: 'font-size:28px;letter-spacing:6px;font-weight:700;color:#0f172a;background:#f1f5f9;border-radius:12px;padding:16px 20px;text-align:center;margin:16px 0;',
  ctaWrap: 'margin-top:20px;margin-bottom:8px;',
  cta: 'display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;font-size:14px;',
  footer: 'margin-top:24px;color:#64748b;font-size:12px;line-height:1.5;text-align:center;',
};

function layout({ title, subtitle, bodyHtml, dashboardUrl, supportEmail }: { title: string; subtitle?: string; bodyHtml: string; dashboardUrl?: string; supportEmail?: string; }) {
  const logoUrl = dashboardUrl ? `${dashboardUrl.replace(/\/$/, '')}/slateai-logo.png` : undefined;
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="${baseStyles.body}">
    <div style="${baseStyles.container}">
      <div style="${baseStyles.card}">
        <div style="${baseStyles.header}">
          ${logoUrl ? `<img src="${logoUrl}" alt="Slate AI" style="${baseStyles.logo}" />` : ''}
          <span style="${baseStyles.brand}">Slate AI</span>
        </div>
        <h1 style="${baseStyles.h1}">${escapeHtml(title)}</h1>
        ${subtitle ? `<p style="${baseStyles.subtitle}">${escapeHtml(subtitle)}</p>` : ''}
        ${bodyHtml}
        ${dashboardUrl ? `<div style="${baseStyles.ctaWrap}"><a style="${baseStyles.cta}" href="${dashboardUrl}" target="_blank" rel="noopener noreferrer">Open Dashboard</a></div>` : ''}
        <div style="${baseStyles.footer}">
          <div>© Slate AI — All rights reserved</div>
          ${supportEmail ? `<div>Need help? Contact <a href="mailto:${supportEmail}" style="color:#0f172a;text-decoration:none;">${supportEmail}</a></div>` : ''}
        </div>
      </div>
    </div>
  </body>
</html>`;
}

export function getEmailHtml(template: TemplateName, vars: TemplateVars): string {
  const v = withDefaults(vars);
  switch (template) {
    case 'otp_verification': {
      const body = `
        <p style="${baseStyles.subtitle}">Hi ${escapeHtml(v.user_name)},</p>
        <p style="${baseStyles.subtitle}">Use the following one-time code to complete verification:</p>
        <div style="${baseStyles.otp}">${escapeHtml(v.otp)}</div>
        <p style="${baseStyles.subtitle}">This code expires in 10 minutes. If you didn’t request this, please ignore this email.</p>
      `;
      return layout({
        title: 'Verify your account',
        subtitle: `${escapeHtml(v.app_name)} requires verification to continue`,
        bodyHtml: body,
        dashboardUrl: v.dashboard_url,
        supportEmail: v.support_email,
      });
    }
    case 'password_change_confirmation': {
      const body = `
        <p style="${baseStyles.subtitle}">Hi ${escapeHtml(v.user_name)},</p>
        <p style="${baseStyles.subtitle}">Your password for ${escapeHtml(v.app_name)} was changed successfully. If this wasn’t you, please reset your password immediately and contact support.</p>
      `;
      return layout({
        title: 'Password changed',
        subtitle: 'Your credentials have been updated',
        bodyHtml: body,
        dashboardUrl: v.dashboard_url,
        supportEmail: v.support_email,
      });
    }
    case 'email_change_confirmation': {
      const body = `
        <p style="${baseStyles.subtitle}">Hi ${escapeHtml(v.user_name)},</p>
        <p style="${baseStyles.subtitle}">Your login email for ${escapeHtml(v.app_name)} has been updated successfully.</p>
      `;
      return layout({
        title: 'Email updated',
        subtitle: 'Your account email has changed',
        bodyHtml: body,
        dashboardUrl: v.dashboard_url,
        supportEmail: v.support_email,
      });
    }
    case 'role_change_notification': {
      const body = `
        <p style="${baseStyles.subtitle}">Hi ${escapeHtml(v.user_name)},</p>
        <p style="${baseStyles.subtitle}">Your role has been updated from <strong>${escapeHtml(v.role_old)}</strong> to <strong>${escapeHtml(v.role_new)}</strong>.</p>
        <p style="${baseStyles.subtitle}">Your access permissions may have changed. Visit the dashboard to explore your updated capabilities.</p>
      `;
      return layout({
        title: 'Role updated',
        subtitle: 'Your access level was changed',
        bodyHtml: body,
        dashboardUrl: v.dashboard_url,
        supportEmail: v.support_email,
      });
    }
    case 'welcome_email': {
      const body = `
        <p style="${baseStyles.subtitle}">Hi ${escapeHtml(v.user_name)},</p>
        <p style="${baseStyles.subtitle}">Welcome to ${escapeHtml(v.app_name)}! We’re excited to have you onboard. Click below to explore your dashboard.</p>
      `;
      return layout({
        title: `Welcome to ${escapeHtml(v.app_name)}`,
        subtitle: 'You’re all set — let’s get started',
        bodyHtml: body,
        dashboardUrl: v.dashboard_url,
        supportEmail: v.support_email,
      });
    }
    default:
      return layout({ title: 'Notification', bodyHtml: '<p style="${baseStyles.subtitle}">No content.</p>' });
  }
}

function withDefaults(vars: TemplateVars): Required<TemplateVars> {
  return {
    user_name: vars.user_name || 'there',
    otp: vars.otp || '000000',
    support_email: vars.support_email || 'support@slate.ai',
    app_name: vars.app_name || 'Slate AI',
    role_old: vars.role_old || 'member',
    role_new: vars.role_new || 'member',
    dashboard_url: vars.dashboard_url || 'https://app.slate.ai',
  };
}

function escapeHtml(str?: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

