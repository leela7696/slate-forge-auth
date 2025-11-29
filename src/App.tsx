import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PermissionProtectedRoute } from "@/components/PermissionProtectedRoute";
import ThemeProvider from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Auth from "./pages/auth/Auth";
import VerifyOtp from "./pages/auth/VerifyOtp";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Users from "./pages/admin/Users";
import AuditLogs from "./pages/admin/AuditLogs";
import RBAC from "./pages/admin/RBAC";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/verify-otp" element={<VerifyOtp />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<PermissionProtectedRoute module="Dashboard" />}>
                <Route path="/dashboard" element={<Dashboard />} />
              </Route>
              <Route element={<PermissionProtectedRoute module="Profile" />}>
                <Route path="/profile" element={<Profile />} />
              </Route>
              <Route element={<PermissionProtectedRoute module="Settings" />}>
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            {/* Admin Routes - Protected by permissions */}
            <Route element={<ProtectedRoute />}>
              <Route element={<PermissionProtectedRoute module="User Management" />}>
                <Route path="/admin/users" element={<Users />} />
              </Route>
              <Route element={<PermissionProtectedRoute module="Audit Logs" />}>
                <Route path="/admin/audit-logs" element={<AuditLogs />} />
              </Route>
              <Route element={<PermissionProtectedRoute module="RBAC" />}>
                <Route path="/admin/rbac" element={<RBAC />} />
              </Route>
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
