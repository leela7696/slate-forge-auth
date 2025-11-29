import { Navigate, Outlet } from "react-router-dom";
import { authHelpers } from "@/lib/auth";

interface ProtectedRouteProps {
  requiredRoles?: string[];
}

export const ProtectedRoute = ({ requiredRoles }: ProtectedRouteProps) => {
  const isAuthenticated = authHelpers.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRoles && !authHelpers.hasRole(requiredRoles)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
};
