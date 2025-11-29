import { Navigate, Outlet } from "react-router-dom";
import { authHelpers } from "@/lib/auth";
import { usePermissions } from "@/hooks/usePermissions";

interface PermissionProtectedRouteProps {
  module: string;
  requiredAction?: 'view' | 'create' | 'edit' | 'delete';
}

export const PermissionProtectedRoute = ({ 
  module, 
  requiredAction = 'view' 
}: PermissionProtectedRouteProps) => {
  const isAuthenticated = authHelpers.isAuthenticated();
  const { hasPermission, loading } = usePermissions();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading permissions...</div>
      </div>
    );
  }

  if (!hasPermission(module, requiredAction)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
};
