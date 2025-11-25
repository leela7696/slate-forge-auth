-- Allow service role and edge functions to insert audit logs
CREATE POLICY "Service role can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow service role to manage audit logs for system operations
CREATE POLICY "Service role can manage audit logs"
ON public.audit_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);