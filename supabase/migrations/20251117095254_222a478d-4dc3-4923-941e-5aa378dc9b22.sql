-- Create email change requests table for secure email updates
CREATE TABLE IF NOT EXISTS public.email_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  old_email TEXT NOT NULL,
  new_email TEXT,
  old_email_otp_hash TEXT NOT NULL,
  new_email_otp_hash TEXT,
  status TEXT NOT NULL CHECK (status IN ('verifying_old', 'verifying_new', 'completed')),
  attempts_left INTEGER NOT NULL DEFAULT 5,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  resend_after TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.email_change_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own email change requests
CREATE POLICY "Users can view own email change requests"
  ON public.email_change_requests
  FOR SELECT
  USING (user_id::text = auth.uid()::text);

-- Policy: Users can insert their own email change requests
CREATE POLICY "Users can insert own email change requests"
  ON public.email_change_requests
  FOR INSERT
  WITH CHECK (user_id::text = auth.uid()::text);

-- Policy: Users can update their own email change requests
CREATE POLICY "Users can update own email change requests"
  ON public.email_change_requests
  FOR UPDATE
  USING (user_id::text = auth.uid()::text);

-- Add phone and department fields to users table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'phone') THEN
    ALTER TABLE public.users ADD COLUMN phone TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'department') THEN
    ALTER TABLE public.users ADD COLUMN department TEXT;
  END IF;
END $$;

-- Create password change requests table for secure password updates
CREATE TABLE IF NOT EXISTS public.password_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  attempts_left INTEGER NOT NULL DEFAULT 5,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  resend_after TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.password_change_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own password change requests
CREATE POLICY "Users can view own password change requests"
  ON public.password_change_requests
  FOR SELECT
  USING (user_id::text = auth.uid()::text);

-- Policy: Users can insert their own password change requests
CREATE POLICY "Users can insert own password change requests"
  ON public.password_change_requests
  FOR INSERT
  WITH CHECK (user_id::text = auth.uid()::text);

-- Policy: Users can update their own password change requests
CREATE POLICY "Users can update own password change requests"
  ON public.password_change_requests
  FOR UPDATE
  USING (user_id::text = auth.uid()::text);