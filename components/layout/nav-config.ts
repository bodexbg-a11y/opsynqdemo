import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Building2,
  KanbanSquare,
  CalendarDays,
  HardHat,
  Users,
  Contact,
  Wrench,
  Truck,
  Warehouse,
  Wallet,
  FolderClosed,
  BarChart3,
  Sparkles,
  Plug,
  Bell,
  Settings,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badgeKey?: "notifications";
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "AI Assistant", href: "/ai-assistant", icon: Sparkles },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Projects", href: "/projects", icon: Building2 },
      { label: "Tasks", href: "/tasks", icon: KanbanSquare },
      { label: "Scheduling", href: "/scheduling", icon: CalendarDays },
    ],
  },
  {
    label: "Workforce",
    items: [
      { label: "Teams", href: "/teams", icon: HardHat },
      { label: "Employees", href: "/employees", icon: Users },
    ],
  },
  {
    label: "Relationships",
    items: [
      { label: "Clients", href: "/clients", icon: Contact },
      { label: "Subcontractors", href: "/subcontractors", icon: Wrench },
    ],
  },
  {
    label: "Resources",
    items: [
      { label: "Equipment", href: "/equipment", icon: Truck },
      { label: "Warehouse", href: "/warehouse", icon: Warehouse },
    ],
  },
  {
    label: "Business",
    items: [
      { label: "Finance", href: "/finance", icon: Wallet },
      { label: "Documents", href: "/documents", icon: FolderClosed },
      { label: "Reports", href: "/reports", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell, badgeKey: "notifications" },
      { label: "Integrations", href: "/integrations", icon: Plug },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];
