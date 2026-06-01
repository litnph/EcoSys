import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  BarChart2,
  Calendar,
  CreditCard,
  FolderTree,
  HandCoins,
  LayoutDashboard,
  PiggyBank,
  Settings,
  Tags,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { ROUTES } from "@/config/routes";

export type SidebarNavItem = {
  href: string;
  labelKey:
    | "dashboard"
    | "transactions"
    | "sources"
    | "billing"
    | "installments"
    | "debt"
    | "reports"
    | "categories"
    | "savings"
    | "investments"
    | "tags"
    | "members"
    | "settings";
  icon: LucideIcon;
  adminOnly?: boolean;
};

export type SidebarNavSectionKey =
  | "daily"
  | "credit"
  | "organize"
  | "assets"
  | "system";

export type SidebarNavSection = {
  sectionKey: SidebarNavSectionKey;
  items: SidebarNavItem[];
};

/** Grouped for personal expense management: daily → credit/debt → metadata → assets → system. */
export const SIDEBAR_NAV_SECTIONS: SidebarNavSection[] = [
  {
    sectionKey: "daily",
    items: [
      { href: ROUTES.dashboard.home, labelKey: "dashboard", icon: LayoutDashboard },
      { href: ROUTES.dashboard.transactions, labelKey: "transactions", icon: ArrowLeftRight },
      { href: ROUTES.dashboard.sources, labelKey: "sources", icon: Wallet },
      { href: ROUTES.dashboard.reports, labelKey: "reports", icon: BarChart2 },
    ],
  },
  {
    sectionKey: "credit",
    items: [
      { href: ROUTES.dashboard.billing, labelKey: "billing", icon: CreditCard },
      { href: ROUTES.dashboard.installments, labelKey: "installments", icon: Calendar },
      { href: ROUTES.dashboard.debt, labelKey: "debt", icon: HandCoins },
    ],
  },
  {
    sectionKey: "organize",
    items: [
      { href: ROUTES.dashboard.categories, labelKey: "categories", icon: FolderTree },
      { href: ROUTES.dashboard.tags, labelKey: "tags", icon: Tags },
    ],
  },
  {
    sectionKey: "assets",
    items: [
      { href: ROUTES.dashboard.savings, labelKey: "savings", icon: PiggyBank },
      { href: ROUTES.dashboard.investments, labelKey: "investments", icon: TrendingUp },
    ],
  },
  {
    sectionKey: "system",
    items: [
      {
        href: ROUTES.dashboard.settingsMembers,
        labelKey: "members",
        icon: Users,
        adminOnly: true,
      },
      { href: ROUTES.dashboard.settings, labelKey: "settings", icon: Settings },
    ],
  },
];

export const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = SIDEBAR_NAV_SECTIONS.flatMap(
  (s) => s.items,
);
