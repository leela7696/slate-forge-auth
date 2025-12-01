-- Add permissions for "My Activity" module to all default roles
-- This module represents viewing one's own audit logs

-- System Admin: can view own activity
INSERT INTO permissions (role_id, module, can_view, can_create, can_edit, can_delete)
SELECT id, 'My Activity', true, false, false, false
FROM roles WHERE name = 'System Admin'
ON CONFLICT DO NOTHING;

-- Admin: can view own activity
INSERT INTO permissions (role_id, module, can_view, can_create, can_edit, can_delete)
SELECT id, 'My Activity', true, false, false, false
FROM roles WHERE name = 'Admin'
ON CONFLICT DO NOTHING;

-- Manager: can view own activity
INSERT INTO permissions (role_id, module, can_view, can_create, can_edit, can_delete)
SELECT id, 'My Activity', true, false, false, false
FROM roles WHERE name = 'Manager'
ON CONFLICT DO NOTHING;

-- User: can view own activity
INSERT INTO permissions (role_id, module, can_view, can_create, can_edit, can_delete)
SELECT id, 'My Activity', true, false, false, false
FROM roles WHERE name = 'User'
ON CONFLICT DO NOTHING;

-- Client: can view own activity
INSERT INTO permissions (role_id, module, can_view, can_create, can_edit, can_delete)
SELECT id, 'My Activity', true, false, false, false
FROM roles WHERE name = 'Client'
ON CONFLICT DO NOTHING;