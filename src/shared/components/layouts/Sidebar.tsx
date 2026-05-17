"use client";

import type { LucideIcon } from "lucide-react";

import * as Tooltip from "@radix-ui/react-tooltip";
import {
  ArrowLeftRight,
  BarChart2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  HandCoins,
  LayoutDashboard,
  Settings,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { ROUTES } from "@/config/routes";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/shared/lib/utils";

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
    | "settings";
  icon: LucideIcon;
};

const NAV_ITEM_DEFS: SidebarNavItem[] = [
  {
    href: ROUTES.dashboard.home,
    labelKey: "dashboard",
    icon: LayoutDashboard,
  },
  {
    href: ROUTES.dashboard.transactions,
    labelKey: "transactions",
    icon: ArrowLeftRight,
  },
  {
    href: ROUTES.dashboard.sources,
    labelKey: "sources",
    icon: Wallet,
  },
  {
    href: ROUTES.dashboard.billing,
    labelKey: "billing",
    icon: CreditCard,
  },
  {
    href: ROUTES.dashboard.installments,
    labelKey: "installments",
    icon: Calendar,
  },
  {
    href: ROUTES.dashboard.debt,
    labelKey: "debt",
    icon: HandCoins,
  },
  {
    href: ROUTES.dashboard.reports,
    labelKey: "reports",
    icon: BarChart2,
  },
  {
    href: ROUTES.dashboard.settings,
    labelKey: "settings",
    icon: Settings,
  },
];

export function isDashboardNavActive(pathname: string, href: string): boolean {
  if (href === ROUTES.dashboard.home) {
    return pathname === "/" || pathname === "";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export type SidebarProps = {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  bannerInsetPx?: number;
};

export function Sidebar({
  collapsed,
  onCollapsedChange,
  bannerInsetPx = 0,
}: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <Tooltip.Provider delayDuration={200}>
      <aside
        style={{
          top: bannerInsetPx,
          height: `calc(100dvh - ${String(bannerInsetPx)}px)`,
        }}
        className={cn(
          "fixed left-0 z-30 hidden shrink-0 flex-col border-r border-warm-200 bg-warm-25 transition-[width] duration-200 ease-out md:flex",
          collapsed ? "w-16" : "w-[240px]",
        )}
        aria-label={t("mainNav")}
      >
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-3">
          {NAV_ITEM_DEFS.map(({ href, labelKey, icon: Icon }) => {
            const label = t(labelKey);
            const active = isDashboardNavActive(pathname, href);
            const content = (
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-warm-600 transition-colors",
                  "hover:bg-warm-100 hover:text-warm-900",
                  active && "bg-accent/10 font-medium text-accent",
                  collapsed && "justify-center px-0",
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                <span
                  className={cn(
                    "truncate transition-opacity duration-200",
                    collapsed ? "sr-only" : "opacity-100",
                  )}
                >
                  {label}
                </span>
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip.Root key={href}>
                  <Tooltip.Trigger asChild>{content}</Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      side="right"
                      sideOffset={8}
                      className={cn(
                        "z-[200] rounded-md border border-warm-200 bg-surface px-2 py-1.5 text-xs font-medium text-warm-900 shadow-md",
                      )}
                    >
                      {label}
                      <Tooltip.Arrow className="fill-surface" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              );
            }

            return <div key={href}>{content}</div>;
          })}
        </div>

        <div className="border-t border-warm-200 p-2">
          <button
            type="button"
            onClick={() => onCollapsedChange(!collapsed)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-warm-600 transition-colors",
              "hover:bg-warm-100 hover:text-warm-900",
              "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
              collapsed && "justify-center px-0",
            )}
            aria-expanded={!collapsed}
            aria-label={collapsed ? t("expandSidebar") : t("collapseSidebar")}
          >
            {collapsed ? (
              <ChevronRight className="size-5 shrink-0" aria-hidden />
            ) : (
              <ChevronLeft className="size-5 shrink-0" aria-hidden />
            )}
            <span
              className={cn(
                "text-sm font-medium",
                collapsed ? "sr-only" : "inline",
              )}
            >
              {collapsed ? t("expand") : t("collapse")}
            </span>
          </button>
        </div>
      </aside>
    </Tooltip.Provider>
  );
}

export const SIDEBAR_NAV_ITEMS = NAV_ITEM_DEFS;
