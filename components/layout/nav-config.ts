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
  Megaphone,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badgeKey?: "notifications";
  tier?: "addon";
  /** Visible to the ProjectManager role (Admin always sees every item). */
  pmVisible?: boolean;
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
      { label: "AI Assistant", href: "/ai-assistant", icon: Sparkles, tier: "addon" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Projects", href: "/projects", icon: Building2, pmVisible: true },
      { label: "Tasks", href: "/tasks", icon: KanbanSquare, pmVisible: true },
      { label: "Scheduling", href: "/scheduling", icon: CalendarDays, tier: "addon" },
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
      { label: "Subcontractors", href: "/subcontractors", icon: Wrench, tier: "addon" },
      { label: "Marketing", href: "/marketing", icon: Megaphone, tier: "addon" },
    ],
  },
  {
    label: "Resources",
    items: [
      { label: "Equipment", href: "/equipment", icon: Truck, tier: "addon" },
      { label: "Warehouse", href: "/warehouse", icon: Warehouse, tier: "addon" },
    ],
  },
  {
    label: "Business",
    items: [
      { label: "Finance", href: "/finance", icon: Wallet, tier: "addon" },
      { label: "Documents", href: "/documents", icon: FolderClosed },
      { label: "Reports", href: "/reports", icon: BarChart3, tier: "addon" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell, badgeKey: "notifications" },
      { label: "Integrations", href: "/integrations", icon: Plug, tier: "addon" },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];
