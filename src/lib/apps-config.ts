import { 
  LayoutDashboard, 
  BarChart3, 
  FileText, 
  Users, 
  Settings,
  LucideIcon
} from "lucide-react";

export interface AppItem {
  name: string;
  icon: LucideIcon;
  route: string;
  description?: string;
  requiredModule?: string;
}

export const apps: AppItem[] = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    route: "/dashboard",
    description: "Overview and analytics",
    requiredModule: "Dashboard",
  },
  {
    name: "Profile",
    icon: Users,
    route: "/profile",
    description: "Manage your profile",
    requiredModule: "Profile",
  },
  {
    name: "User Management",
    icon: Users,
    route: "/admin/users",
    description: "Manage users",
    requiredModule: "User Management",
  },
  {
    name: "Audit Logs",
    icon: FileText,
    route: "/admin/audit-logs",
    description: "System activity",
    requiredModule: "Audit Logs",
  },
  {
    name: "RBAC",
    icon: Settings,
    route: "/admin/rbac",
    description: "Role management",
    requiredModule: "RBAC",
  },
  {
    name: "Analytics",
    icon: BarChart3,
    route: "/analytics",
    description: "Data insights",
    requiredModule: "Analytics",
  },
  {
    name: "Settings",
    icon: Settings,
    route: "/settings",
    description: "Configure system",
    requiredModule: "Settings",
  },
];
