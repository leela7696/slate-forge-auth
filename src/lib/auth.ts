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
  
  clearPermissionsCache: (): void => {
    localStorage.removeItem('user_permissions_cache');
  },
};

export const callEdgeFunction = async (
  functionName: string,
  body?: any,
  options?: {
    skipAuthHeader?: boolean;
    headers?: Record<string, string>;
  }
) => {
  const token = authStorage.getToken();
  const headers: Record<string, string> = { ...(options?.headers || {}) };

  if (token && !options?.skipAuthHeader) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Check if body is URLSearchParams (for GET requests with query params)
  const isUrlParams = body instanceof URLSearchParams;
  
  // For GET requests with query params, append them to the function name
  const functionPath = isUrlParams ? `${functionName}?${body.toString()}` : functionName;
  const requestBody = isUrlParams ? undefined : body;

  const { data, error } = await supabase.functions.invoke(functionPath, {
    body: requestBody,
    ...(Object.keys(headers).length > 0 && { headers }),
  });

  if (error) {
    // Try to surface more specific messages from the edge function response
    const enriched: any = error;
    const context: any = (error as any).context;
    // Supabase functions error often includes raw response body in context.body
    if (context) {
      const rawBody = typeof context.body === 'string' ? context.body : undefined;
      if (rawBody) {
        try {
          const parsed = JSON.parse(rawBody);
          // If backend provided explicit error fields, hoist them
          if (parsed && typeof parsed === 'object') {
            if (parsed.error && typeof parsed.error === 'string') {
              enriched.error = parsed.error;
              enriched.message = parsed.error;
            } else if (parsed.message && typeof parsed.message === 'string') {
              enriched.message = parsed.message;
            }
          }
        } catch {
          // ignore JSON parse errors, fall back to default message
        }
      }
    }
    throw enriched;
  }
  return data;
};
