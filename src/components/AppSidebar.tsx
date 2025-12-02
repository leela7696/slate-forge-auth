import { LayoutDashboard, User, Users, FileText, LogOut, Shield, History } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { authHelpers, authStorage } from "@/lib/auth";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = authStorage.getUser();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { canViewModule, loading } = usePermissions();

  const mainItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, module: "Dashboard" },
    { title: "Profile", url: "/profile", icon: User, module: "Profile" },
    { title: "My Activity", url: "/my-activity", icon: History, module: "My Activity" },
  ];

  // Build admin items based on actual permissions
  const adminItems = [
    { title: "Users", url: "/admin/users", icon: Users, module: "User Management" },
    { title: "Audit Logs", url: "/admin/audit-logs", icon: FileText, module: "Audit Logs" },
    { title: "RBAC", url: "/admin/rbac", icon: Shield, module: "RBAC" },
  ].filter(item => canViewModule(item.module));

  // Filter main items based on permissions too
  const visibleMainItems = mainItems.filter(item => canViewModule(item.module));

  const handleLogout = () => {
    authHelpers.logout();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className="border-r" collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {adminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url} end>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <div className="mt-auto p-4 border-t border-sidebar-border">
          <SidebarMenuButton onClick={handleLogout} className="w-full">
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </SidebarMenuButton>
        </div>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
