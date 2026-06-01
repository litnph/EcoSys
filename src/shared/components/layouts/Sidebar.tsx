import * as Tooltip from "@radix-ui/react-tooltip";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "@/i18n/hooks";

import { ROUTES } from "@/config/routes";
import { Link, usePathname } from "@/i18n/navigation";
import { useIsAdmin } from "@/shared/hooks/useIsAdmin";
import { cn } from "@/shared/lib/utils";

import {
  SIDEBAR_NAV_SECTIONS,
  type SidebarNavItem,
  type SidebarNavSectionKey,
} from "./sidebarNav";

export type { SidebarNavItem } from "./sidebarNav";
export { SIDEBAR_NAV_ITEMS, SIDEBAR_NAV_SECTIONS } from "./sidebarNav";

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

function NavLink({
  href,
  labelKey,
  icon: Icon,
  collapsed,
  pathname,
  t,
}: SidebarNavItem & {
  collapsed: boolean;
  pathname: string;
  t: (key: SidebarNavItem["labelKey"]) => string;
}) {
  const label = t(labelKey);
  const active = isDashboardNavActive(pathname, href);
  const content = (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-warm-600 transition-colors",
        "hover:bg-warm-100 hover:text-warm-900",
        active && "bg-accent/10 font-medium text-accent-emphasis",
        collapsed && "justify-center px-0")}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      <span
        className={cn(
          "truncate transition-opacity duration-200",
          collapsed ? "sr-only" : "opacity-100")}
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
              "z-[200] rounded-md border border-warm-200 bg-surface px-2 py-1.5 text-xs font-medium text-warm-900 shadow-md")}
          >
            {label}
            <Tooltip.Arrow className="fill-surface" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    );
  }

  return <div key={href}>{content}</div>;
}

export function Sidebar({
  collapsed,
  onCollapsedChange,
  bannerInsetPx = 0,
}: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const isAdmin = useIsAdmin();

  const sectionTitle = (key: SidebarNavSectionKey): string =>
    t(
      key === "daily"
        ? "sectionDaily"
        : key === "credit"
          ? "sectionCredit"
          : key === "organize"
            ? "sectionOrganize"
            : key === "assets"
              ? "sectionAssets"
              : "sectionSystem",
    );

  return (
    <Tooltip.Provider delayDuration={200}>
      <aside
        style={{
          top: bannerInsetPx,
          height: `calc(100dvh - ${String(bannerInsetPx)}px)`,
        }}
        className={cn(
          "fixed left-0 z-30 flex shrink-0 flex-col border-r border-warm-200 bg-warm-25 transition-[width] duration-200 ease-out",
          collapsed ? "w-16" : "w-[240px]")}
        aria-label={t("mainNav")}
      >
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-3">
          {SIDEBAR_NAV_SECTIONS.map((section, sectionIdx) => {
            const visibleItems = section.items.filter(
              (item) => !item.adminOnly || isAdmin,
            );
            if (visibleItems.length === 0) return null;

            return (
              <div
                key={section.sectionKey}
                className={cn(sectionIdx > 0 && "mt-2 border-t border-warm-200/80 pt-2")}
              >
                {!collapsed ? (
                  <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-warm-400">
                    {sectionTitle(section.sectionKey)}
                  </p>
                ) : null}
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.href}
                    {...item}
                    collapsed={collapsed}
                    pathname={pathname}
                    t={t}
                  />
                ))}
              </div>
            );
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
              collapsed && "justify-center px-0")}
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
                collapsed ? "sr-only" : "inline")}
            >
              {collapsed ? t("expand") : t("collapse")}
            </span>
          </button>
        </div>
      </aside>
    </Tooltip.Provider>
  );
}
