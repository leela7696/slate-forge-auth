-- Migration to change users.role from enum to TEXT to support custom roles

-- Step 1: Drop RLS policies that depend on the role column
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

-- Step 2: Drop policies on other tables that reference user role
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Service role can manage audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.roles;
DROP POLICY IF EXISTS "Everyone can view roles" ON public.roles;
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.permissions;
DROP POLICY IF EXISTS "Everyone can view permissions" ON public.permissions;

-- Step 3: Alter the column type to TEXT
ALTER TABLE public.users 
ALTER COLUMN role TYPE TEXT USING role::text,
ALTER COLUMN role SET DEFAULT 'User';

-- Step 4: Drop the old enum type
DROP TYPE IF EXISTS app_role CASCADE;

-- Step 5: Recreate RLS policies for users table
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
TO authenticated
USING (
  (id::text = auth.uid()::text) OR 
  (role IN ('Admin', 'System Admin'))
);

CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (
  (id::text = auth.uid()::text) OR 
  (role IN ('Admin', 'System Admin'))
);

CREATE POLICY "Admins can insert users"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (role IN ('Admin', 'System Admin'));

CREATE POLICY "Admins can delete users"
ON public.users
FOR DELETE
TO authenticated
USING (role IN ('Admin', 'System Admin'));

-- Step 6: Recreate RLS policies for audit_logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id::text = auth.uid()::text
    AND users.role IN ('Admin', 'System Admin')
  )
);

CREATE POLICY "Service role can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Service role can manage audit logs"
ON public.audit_logs
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Step 7: Recreate RLS policies for roles table
CREATE POLICY "Admins can manage roles"
ON public.roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id::text = auth.uid()::text
    AND users.role IN ('Admin', 'System Admin')
  )
);

CREATE POLICY "Everyone can view roles"
ON public.roles
FOR SELECT
TO authenticated
USING (true);

-- Step 8: Recreate RLS policies for permissions table
CREATE POLICY "Admins can manage permissions"
ON public.permissions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id::text = auth.uid()::text
    AND users.role IN ('Admin', 'System Admin')
  )
);

CREATE POLICY "Everyone can view permissions"
ON public.permissions
FOR SELECT
TO authenticated
USING (true);

-- Step 9: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);