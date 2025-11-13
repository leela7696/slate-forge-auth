-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('System Admin', 'Admin', 'Manager', 'User');

-- Users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role public.app_role DEFAULT 'User',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  external_providers JSONB,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- OTP requests table
CREATE TABLE public.otp_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  attempts_left INTEGER DEFAULT 5,
  expires_at TIMESTAMPTZ NOT NULL,
  resend_after TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles table
CREATE TABLE public.roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions table
CREATE TABLE public.permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER REFERENCES public.roles(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  can_view BOOLEAN DEFAULT FALSE,
  can_create BOOLEAN DEFAULT FALSE,
  can_edit BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID,
  actor_email TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  target_id TEXT,
  target_type TEXT,
  target_summary TEXT,
  details JSONB,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  prev_hash TEXT,
  chain_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chain head table
CREATE TABLE public.chain_head (
  id INTEGER PRIMARY KEY DEFAULT 1,
  latest_hash TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert initial chain head
INSERT INTO public.chain_head (id, latest_hash) VALUES (1, '0');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chain_head ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users (users can read their own profile, admins can read all)
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (id::text = auth.uid()::text OR role IN ('Admin', 'System Admin'));

CREATE POLICY "Admins can insert users"
  ON public.users FOR INSERT
  WITH CHECK (role IN ('Admin', 'System Admin'));

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (id::text = auth.uid()::text OR role IN ('Admin', 'System Admin'));

CREATE POLICY "Admins can delete users"
  ON public.users FOR DELETE
  USING (role IN ('Admin', 'System Admin'));

-- RLS for otp_requests (public access for signup flow, managed by edge functions)
CREATE POLICY "Service role can manage OTP requests"
  ON public.otp_requests FOR ALL
  USING (true);

-- RLS for roles (admins can manage)
CREATE POLICY "Everyone can view roles"
  ON public.roles FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage roles"
  ON public.roles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE id::text = auth.uid()::text 
    AND role IN ('Admin', 'System Admin')
  ));

-- RLS for permissions
CREATE POLICY "Everyone can view permissions"
  ON public.permissions FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage permissions"
  ON public.permissions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE id::text = auth.uid()::text 
    AND role IN ('Admin', 'System Admin')
  ));

-- RLS for audit logs (read-only for admins)
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE id::text = auth.uid()::text 
    AND role IN ('Admin', 'System Admin')
  ));

-- RLS for chain_head
CREATE POLICY "Everyone can view chain head"
  ON public.chain_head FOR SELECT
  USING (true);

-- Seed initial roles
INSERT INTO public.roles (name, description) VALUES
  ('System Admin', 'Full system access with all privileges'),
  ('Admin', 'Administrative access to manage users and view audit logs'),
  ('Manager', 'Can manage team resources and view reports'),
  ('User', 'Standard user access');

-- Seed permissions for System Admin role
INSERT INTO public.permissions (role_id, module, can_view, can_create, can_edit, can_delete)
SELECT 1, module, true, true, true, true
FROM (VALUES 
  ('users'),
  ('roles'),
  ('permissions'),
  ('audit_logs'),
  ('dashboard')
) AS modules(module);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_otp_email ON public.otp_requests(email);
CREATE INDEX idx_audit_actor ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_action ON public.audit_logs(action);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at DESC);