/**
 * Reusable audit logger utility for edge functions
 * Captures actor, target, before/after values, and metadata
 */

interface AuditLogParams {
  action: string;
  module: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  targetId?: string;
  targetEmail?: string;
  targetSummary?: string;
  targetType?: string;
  beforeValues?: Record<string, any>;
  afterValues?: Record<string, any>;
  success: boolean;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function auditLogger(
  supabase: any,
  params: AuditLogParams
): Promise<void> {
  const {
    action,
    module,
    actorId,
    actorEmail,
    actorRole,
    targetId,
    targetEmail,
    targetSummary,
    targetType,
    beforeValues,
    afterValues,
    success,
    metadata,
    ipAddress = 'unknown',
    userAgent = 'unknown',
  } = params;

  // Construct details JSON with before/after if provided
  const details: any = {};
  if (beforeValues && Object.keys(beforeValues).length > 0) {
    details.before = beforeValues;
  }
  if (afterValues && Object.keys(afterValues).length > 0) {
    details.after = afterValues;
  }

  const logEntry = {
    action,
    module,
    actor_id: actorId || null,
    actor_email: actorEmail || null,
    actor_role: actorRole || null,
    target_id: targetId || null,
    target_email: targetEmail || null,
    target_summary: targetSummary || null,
    target_type: targetType || null,
    details: Object.keys(details).length > 0 ? details : null,
    metadata: metadata || null,
    success,
    ip_address: ipAddress,
    user_agent: userAgent,
  };

  try {
    const { error } = await supabase.from('audit_logs').insert(logEntry);
    
    if (error) {
      console.error('Failed to insert audit log:', error);
    }
  } catch (err) {
    console.error('Audit logging error:', err);
  }
}
