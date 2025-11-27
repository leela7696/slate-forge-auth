import { supabase } from "@/integrations/supabase/client";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  department?: string;
  profile_picture_url?: string;
  created_at?: string;
}

export const authStorage = {
  getToken: (): string | null => {
    return localStorage.getItem('auth_token');
  },
  setToken: (token: string): void => {
    localStorage.setItem('auth_token', token);
  },
  removeToken: (): void => {
    localStorage.removeItem('auth_token');
  },
  getUser: (): User | null => {
    const userStr = localStorage.getItem('auth_user');
    return userStr ? JSON.parse(userStr) : null;
  },
  setUser: (user: User): void => {
    localStorage.setItem('auth_user', JSON.stringify(user));
  },
  removeUser: (): void => {
    localStorage.removeItem('auth_user');
  },
};

export const authHelpers = {
  isAuthenticated: (): boolean => {
    return !!authStorage.getToken();
  },
  
  hasRole: (requiredRoles: string[]): boolean => {
    const user = authStorage.getUser();
    if (!user) return false;
    return requiredRoles.includes(user.role);
  },

  logout: (): void => {
    authStorage.removeToken();
    authStorage.removeUser();
    // Clear permissions cache
    localStorage.removeItem('user_permissions_cache');
  },
};

export const callEdgeFunction = async (
  functionName: string,
  body?: any
) => {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Check if body is FormData
  const isFormData = body instanceof FormData;

  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
    ...(Object.keys(headers).length > 0 && { headers }),
  });

  if (error) throw error;
  return data;
};