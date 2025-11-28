-- Add target_email column to audit_logs table
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS target_email text;

-- Add comment to clarify that details field stores before/after values
COMMENT ON COLUMN public.audit_logs.details IS 'Stores before/after values as JSON: {"before": {...}, "after": {...}}';

-- Create index for faster filtering and searching
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON public.audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_email ON public.audit_logs(actor_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_email ON public.audit_logs(target_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON public.audit_logs(success);