import { 
  LayoutDashboard, 
  Sprout, 
  Map, 
  Calendar, 
  BarChart3, 
  FileText, 
  Users, 
  Settings, 
  MessageSquare,
  LucideIcon
} from "lucide-react";

export interface AppItem {
  name: string;
  icon: LucideIcon;
  route: string;
  description?: string;
  requiredRoles?: string[];
}

export const apps: AppItem[] = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    route: "/dashboard",
    description: "Overview and analytics",
  },
  {
    name: "Crop Monitoring",
    icon: Sprout,
    route: "/crop-monitoring",
    description: "Track crop health",
  },
  {
    name: "Field Mapping",
    icon: Map,
    route: "/field-mapping",
    description: "Manage field layouts",
  },
  {
    name: "Scheduling",
    icon: Calendar,
    route: "/scheduling",
    description: "Plan activities",
  },
  {
    name: "Analytics",
    icon: BarChart3,
    route: "/analytics",
    description: "Data insights",
  },
  {
    name: "Audit Logs",
    icon: FileText,
    route: "/audit-logs",
    description: "System activity",
  },
  {
    name: "User Management",
    icon: Users,
    route: "/user-management",
    description: "Manage users",
    requiredRoles: ["System Admin", "Admin"],
  },
  {
    name: "Settings",
    icon: Settings,
    route: "/settings",
    description: "Configure system",
  },
  {
    name: "Support",
    icon: MessageSquare,
    route: "/support",
    description: "Get help",
  },
];
