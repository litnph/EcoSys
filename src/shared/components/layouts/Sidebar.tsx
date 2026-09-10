import * as Tooltip from "@radix-ui/react-tooltip";
import { motion, useReducedMotion } from "framer-motion";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect, useRef } from "react";

import { ROUTES } from "@/config/routes";
import { useTranslations } from "@/i18n/hooks";
import { Link, usePathname } from "@/i18n/navigation";
import { useIsAdmin } from "@/shared/hooks/useIsAdmin";
import { cn } from "@/shared/lib/utils";

import { SIDEBAR_NAV_ITEMS, type SidebarNavItem } from "./sidebarNav";

export type { SidebarNavItem } from "./sidebarNav";
export { SIDEBAR_NAV_ITEMS } from "./sidebarNav";

const MOTION_EASE = [0.16, 1, 0.3, 1] as const;

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
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

type SidebarTooltipProps = {
  label: string;
  children: React.ReactElement;
};

function SidebarTooltip({ label, children }: SidebarTooltipProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="right"
          sideOffset={10}
          className="z-[200] rounded-md border border-warm-200 bg-surface px-2.5 py-1.5 text-xs font-semibold text-warm-900 elevation-menu"
        >
          {label}
          <Tooltip.Arrow className="fill-surface" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function NavLink({
  href,
  labelKey,
  icon: Icon,
  collapsed,
  pathname,
  t,
  onNavigate,
}: SidebarNavItem & {
  collapsed: boolean;
  pathname: string;
  t: (key: SidebarNavItem["labelKey"]) => string;
  onNavigate?: () => void;
}) {
  const label = t(labelKey);
  const active = isDashboardNavActive(pathname, href);

  const content = (
    <Link
      href={href}
      onClick={() => onNavigate?.()}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? label : undefined}
      className={cn(
        "group/nav relative flex min-h-11 w-full items-center gap-3 rounded-button px-2 text-sm outline-none transition-colors duration-150 motion-reduce:transition-none",
        "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
        active
          ? "bg-warm-100 font-semibold text-warm-950"
          : "font-medium text-warm-600 hover:bg-warm-50 hover:text-warm-900",
        collapsed && "justify-center px-0",
      )}
    >
      {active ? (
        <span
          className="absolute inset-y-2 left-0 w-px rounded-full bg-accent"
          aria-hidden
        />
      ) : null}

      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-md transition-colors duration-150 motion-reduce:transition-none",
          active
            ? "bg-accent text-white"
            : "text-warm-500 group-hover/nav:bg-warm-100 group-hover/nav:text-warm-900",
        )}
      >
        <Icon className="size-[18px]" strokeWidth={1.8} aria-hidden />
      </span>

      <span className={cn("min-w-0 flex-1 truncate", collapsed && "sr-only")}>
        {label}
      </span>
    </Link>
  );

  return collapsed ? (
    <SidebarTooltip label={label}>{content}</SidebarTooltip>
  ) : (
    content
  );
}

export function Sidebar({
  collapsed,
  onCollapsedChange,
  bannerInsetPx = 0,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const isAdmin = useIsAdmin();
  const shouldReduceMotion = useReducedMotion();
  const isCollapsed = mobileOpen ? false : collapsed;
  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const visibleItems = SIDEBAR_NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin,
  );
  const sidebarActionLabel = isCollapsed
    ? t("openSidebar")
    : t("closeSidebar");

  useEffect(() => {
    if (!mobileOpen) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const backgroundElements = [
      document.getElementById("dashboard-top-nav"),
      document.getElementById("dashboard-main"),
    ].filter((element): element is HTMLElement => element !== null);
    const previousOverflow = document.body.style.overflow;

    backgroundElements.forEach((element) => {
      element.setAttribute("inert", "");
      element.setAttribute("aria-hidden", "true");
    });
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onMobileClose?.();
        return;
      }

      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute("aria-hidden"));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;
      const focusIsOutsideDrawer = !drawerRef.current.contains(activeElement);

      if (event.shiftKey && (activeElement === first || focusIsOutsideDrawer)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (activeElement === last || focusIsOutsideDrawer)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      backgroundElements.forEach((element) => {
        element.removeAttribute("inert");
        element.removeAttribute("aria-hidden");
      });
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [mobileOpen, onMobileClose]);

  const collapseControl = (
    <motion.button
      layout
      type="button"
      onClick={() => onCollapsedChange(!collapsed)}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.14,
        ease: MOTION_EASE,
      }}
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-button border border-warm-200 bg-surface text-warm-600 outline-none transition-colors duration-150 motion-reduce:transition-none",
        "hover:border-warm-300 hover:bg-warm-100 hover:text-warm-900",
        "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
      )}
      aria-label={sidebarActionLabel}
      aria-expanded={!isCollapsed}
      aria-controls="dashboard-sidebar-navigation"
    >
      {isCollapsed ? (
        <PanelLeftOpen className="size-[19px]" aria-hidden />
      ) : (
        <PanelLeftClose className="size-[19px]" aria-hidden />
      )}
    </motion.button>
  );

  return (
    <Tooltip.Provider delayDuration={180} skipDelayDuration={100}>
      {mobileOpen ? (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-warm-950/55 md:hidden"
          onClick={onMobileClose}
        />
      ) : null}

      <aside
        id="dashboard-sidebar"
        ref={drawerRef}
        style={{
          top: bannerInsetPx,
          height: `calc(100dvh - ${String(bannerInsetPx)}px)`,
        }}
        className={cn(
          "fixed left-0 z-50 flex shrink-0 flex-col border-r border-warm-200 bg-surface transition-[width] duration-200 ease-out motion-reduce:transition-none md:z-30",
          "w-[min(256px,calc(100vw-24px))] md:w-[256px]",
          isCollapsed && "md:w-[76px]",
          mobileOpen ? "flex elevation-overlay" : "hidden md:flex",
        )}
        role={mobileOpen ? "dialog" : undefined}
        aria-modal={mobileOpen ? "true" : undefined}
        aria-label={t("mainNav")}
      >
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-warm-200 px-3",
            isCollapsed ? "justify-center" : "justify-between gap-2",
          )}
        >
          {!isCollapsed ? (
            <Link
              href={ROUTES.dashboard.home}
              onClick={() => onMobileClose?.()}
              className="group flex min-w-0 items-center gap-3 rounded-button outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              aria-label="EcoSys"
            >
              <span className="relative flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-accent text-xs font-extrabold tracking-[-0.04em] text-white">
                ES
                <span
                  className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-surface bg-white"
                  aria-hidden
                />
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[15px] font-bold tracking-[-0.025em] text-warm-950">
                  EcoSys
                </span>
                <span className="mt-0.5 block truncate text-[11px] font-medium text-warm-500">
                  {t("appSubtitle")}
                </span>
              </span>
            </Link>
          ) : null}

          {mobileOpen ? (
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onMobileClose}
              className="flex size-10 shrink-0 items-center justify-center rounded-button text-warm-600 outline-none transition-colors duration-150 hover:bg-warm-100 hover:text-warm-900 focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none md:hidden"
              aria-label={t("closeMenu")}
            >
              <PanelLeftClose className="size-5" aria-hidden />
            </button>
          ) : (
            <SidebarTooltip label={sidebarActionLabel}>
              {collapseControl}
            </SidebarTooltip>
          )}
        </div>

        <nav
          id="dashboard-sidebar-navigation"
          className="scrollbar-stable flex-1 overflow-y-auto px-3 py-3"
          aria-label={t("mainNav")}
        >
          <ul className="space-y-1">
            {visibleItems.map((item) => (
              <li key={item.href}>
                <NavLink
                  {...item}
                  collapsed={isCollapsed}
                  pathname={pathname}
                  t={t}
                  onNavigate={onMobileClose}
                />
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </Tooltip.Provider>
  );
}
