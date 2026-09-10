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
    | "settings";
  icon: LucideIcon;
  adminOnly?: boolean;
};

/** Single source of truth for both the flat sidebar and quick navigation. */
export const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  { href: ROUTES.dashboard.home, labelKey: "dashboard", icon: LayoutDashboard },
  { href: ROUTES.dashboard.transactions, labelKey: "transactions", icon: ArrowLeftRight },
  { href: ROUTES.dashboard.sources, labelKey: "sources", icon: Wallet },
  { href: ROUTES.dashboard.reports, labelKey: "reports", icon: BarChart2 },
  { href: ROUTES.dashboard.billing, labelKey: "billing", icon: CreditCard },
  { href: ROUTES.dashboard.installments, labelKey: "installments", icon: Calendar },
  { href: ROUTES.dashboard.debt, labelKey: "debt", icon: HandCoins },
  { href: ROUTES.dashboard.categories, labelKey: "categories", icon: FolderTree },
  { href: ROUTES.dashboard.tags, labelKey: "tags", icon: Tags },
  { href: ROUTES.dashboard.savings, labelKey: "savings", icon: PiggyBank },
  { href: ROUTES.dashboard.investments, labelKey: "investments", icon: TrendingUp },
  { href: ROUTES.dashboard.settings, labelKey: "settings", icon: Settings },
];
