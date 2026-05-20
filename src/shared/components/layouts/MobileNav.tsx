"use client";

import {
  BarChart2,
  LayoutDashboard,
  ArrowLeftRight,
  Plus,
  Settings,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ROUTES } from "@/config/routes";
import { Link, usePathname } from "@/i18n/navigation";
import { Drawer } from "@/shared/components/ui/Drawer";
import { cn } from "@/shared/lib/utils";

const TRANSACTION_CREATE_OPTIONS = [
  {
    labelKey: "expense" as const,
    descKey: "expenseDesc" as const,
    href: `${ROUTES.dashboard.transactions}?create=expense`,
  },
  {
    labelKey: "income" as const,
    descKey: "incomeDesc" as const,
    href: `${ROUTES.dashboard.transactions}?create=income`,
  },
  {
    labelKey: "transfer" as const,
    descKey: "transferDesc" as const,
    href: `${ROUTES.dashboard.transactions}?create=transfer`,
  },
];

type TabKey = "dashboard" | "transactions" | "add" | "reports" | "settings";

const TABS: {
  key: Exclude<TabKey, "add">;
  href: string;
  labelKey: "dashboard" | "transactions" | "reports" | "settings";
  icon: typeof LayoutDashboard;
}[] = [
  {
    key: "dashboard",
    href: ROUTES.dashboard.home,
    labelKey: "dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "transactions",
    href: ROUTES.dashboard.transactions,
    labelKey: "transactions",
    icon: ArrowLeftRight,
  },
  {
    key: "reports",
    href: ROUTES.dashboard.reports,
    labelKey: "reports",
    icon: BarChart2,
  },
  {
    key: "settings",
    href: ROUTES.dashboard.settings,
    labelKey: "settings",
    icon: Settings,
  },
];

function isTabActive(pathname: string, href: string): boolean {
  if (href === ROUTES.dashboard.home) {
    return pathname === "/" || pathname === "";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav() {
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);
  const tNav = useTranslations("nav");
  const tMobile = useTranslations("mobileNav");
  const tTx = useTranslations("transaction");

  return (
    <>
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 flex min-h-16 items-stretch justify-between gap-1 border-t border-warm-200 bg-warm-25 px-2 pb-[max(0px,env(safe-area-inset-bottom))] pt-1 md:hidden")}
        aria-label={tNav("mobileNavAria")}
      >
        {TABS.slice(0, 2).map(({ href, labelKey, icon: Icon }) => {
          const active = isTabActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 text-xs font-medium transition-colors duration-150",
                active ? "text-accent-emphasis" : "text-nav-inactive")}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <span className="truncate">{tNav(labelKey)}</span>
            </Link>
          );
        })}

        <div className="flex w-14 shrink-0 flex-col items-center">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className={cn(
              "relative -top-2 flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg outline-none transition-transform active:scale-95",
              "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2")}
            aria-label={tTx("addTransactionAria")}
          >
            <Plus className="size-6" strokeWidth={2.25} aria-hidden />
          </button>
        </div>

        {TABS.slice(2).map(({ href, labelKey, icon: Icon }) => {
          const active = isTabActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 text-xs font-medium transition-colors duration-150",
                active ? "text-accent-emphasis" : "text-nav-inactive")}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <span className="truncate">{tNav(labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      <Drawer
        side="bottom"
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title={tTx("newTransaction")}
        description={tTx("createDrawerDescription")}
        size="md"
      >
        <ul className="flex flex-col gap-2">
          {TRANSACTION_CREATE_OPTIONS.map((opt) => (
            <li key={opt.labelKey}>
              <Link
                href={opt.href}
                onClick={() => setCreateOpen(false)}
                className={cn(
                  "block w-full rounded-lg border border-warm-200 bg-surface px-4 py-3 text-left transition-colors",
                  "hover:border-accent/40 hover:bg-warm-100/60")}
              >
                <span className="font-medium text-warm-900">
                  {tMobile(opt.labelKey)}
                </span>
                <span className="mt-0.5 block text-sm text-warm-600">
                  {tMobile(opt.descKey)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Drawer>
    </>
  );
}
