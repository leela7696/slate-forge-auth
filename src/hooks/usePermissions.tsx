import { useState, useEffect, useCallback } from "react";
import { callEdgeFunction } from "@/lib/auth";
import { authStorage } from "@/lib/auth";

interface Permission {
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

interface PermissionsCache {
  [roleName: string]: Permission[];
}

// Cache permissions in localStorage
const PERMISSIONS_CACHE_KEY = 'user_permissions_cache';

const getPermissionsFromCache = (roleName: string): Permission[] | null => {
  try {
    const cached = localStorage.getItem(PERMISSIONS_CACHE_KEY);
    if (cached) {
      const cache: PermissionsCache = JSON.parse(cached);
      return cache[roleName] || null;
    }
  } catch (error) {
    console.error('Error reading permissions cache:', error);
  }
  return null;
};

const savePermissionsToCache = (roleName: string, permissions: Permission[]) => {
  try {
    const cached = localStorage.getItem(PERMISSIONS_CACHE_KEY);
    const cache: PermissionsCache = cached ? JSON.parse(cached) : {};
    cache[roleName] = permissions;
    localStorage.setItem(PERMISSIONS_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving permissions cache:', error);
  }
};

export function usePermissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const user = authStorage.getUser();

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user?.role) {
        setLoading(false);
        return;
      }

      // Check cache first
      const cached = getPermissionsFromCache(user.role);
      if (cached) {
        setPermissions(cached);
        setLoading(false);
        return;
      }

      try {
        // Fetch role ID first, then permissions
        const rolesData = await callEdgeFunction("get-roles");
        const role = rolesData.roles.find((r: any) => r.name === user.role);
        
        if (!role) {
          console.error('Role not found:', user.role);
          setLoading(false);
          return;
        }

        const permissionsData = await callEdgeFunction("get-permissions", { 
          roleId: role.id.toString() 
        });
        
        const perms = permissionsData.permissions || [];
        setPermissions(perms);
        savePermissionsToCache(user.role, perms);
      } catch (error) {
        console.error('Error fetching permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user?.role]);

  const hasPermission = useCallback((module: string, action: 'view' | 'create' | 'edit' | 'delete'): boolean => {
    const perm = permissions.find(p => p.module === module);
    if (!perm) return false;

    switch (action) {
      case 'view': return perm.can_view;
      case 'create': return perm.can_create;
      case 'edit': return perm.can_edit;
      case 'delete': return perm.can_delete;
      default: return false;
    }
  }, [permissions]);

  const canViewModule = useCallback((module: string): boolean => {
    return hasPermission(module, 'view');
  }, [hasPermission]);

  return {
    permissions,
    loading,
    hasPermission,
    canViewModule,
  };
}

// Clear permissions cache on logout
export const clearPermissionsCache = () => {
  localStorage.removeItem(PERMISSIONS_CACHE_KEY);
};
