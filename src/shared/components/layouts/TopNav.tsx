import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { CalendarRange, ChevronRight, Menu } from "lucide-react";
import { AvatarImage } from "@/shared/components/ui/AvatarImage";
import { useEffect, useState } from "react";
import { useTranslations } from "@/i18n/hooks";

import { ROUTES } from "@/config/routes";
import { TOKEN_KEY } from "@/config/constants";
import { Link, useLocale, usePathname } from "@/i18n/navigation";
import { buildDashboardBreadcrumbs } from "@/shared/lib/dashboard-breadcrumb";
import {
  initialsFromNameOrEmail,
  readJwtDisplayClaims,
} from "@/shared/lib/jwt-display";
import { getLocalStorageItem, logout } from "@/shared/lib/auth-session";
import { cn } from "@/shared/lib/utils";
import { NotificationMenu } from "@/features/notifications/components";
import { CommandMenu } from "./CommandMenu";

export type TopNavUser = {
  name: string;
  email: string;
  avatarUrl?: string | null;
};

export type TopNavProps = {
  sidebarCollapsed: boolean;
  mobileMenuOpen?: boolean;
  user?: TopNavUser;
  bannerInsetPx?: number;
  onMenuClick?: () => void;
};

export function TopNav({
  sidebarCollapsed,
  mobileMenuOpen = false,
  user: userProp,
  bannerInsetPx = 0,
  onMenuClick,
}: TopNavProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const tNav = useTranslations("nav");
  const crumbs = buildDashboardBreadcrumbs(pathname);
  const crumbKeyByHref: Record<string, Parameters<typeof tNav>[0]> = {
    [ROUTES.dashboard.home]: "dashboard",
    [ROUTES.dashboard.transactions]: "transactions",
    [ROUTES.dashboard.sources]: "sources",
    [ROUTES.dashboard.billing]: "billing",
    [ROUTES.dashboard.installments]: "installments",
    [ROUTES.dashboard.debt]: "debt",
    [ROUTES.dashboard.reports]: "reports",
    [ROUTES.dashboard.categories]: "categories",
    [ROUTES.dashboard.savings]: "savings",
    [ROUTES.dashboard.investments]: "investments",
    [ROUTES.dashboard.tags]: "tags",
    [ROUTES.dashboard.profile]: "profile",
    [ROUTES.dashboard.settings]: "settings",
    [ROUTES.dashboard.settingsProfile]: "profile",
    [ROUTES.dashboard.settingsPreferences]: "preferences",
    [ROUTES.dashboard.settingsClassification]: "classification",
    [ROUTES.dashboard.settingsMembers]: "members",
  };

  const [name, setName] = useState(() => userProp?.name ?? "User");
  const [email, setEmail] = useState(() => userProp?.email ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    () => userProp?.avatarUrl ?? null);

  useEffect(() => {
    if (userProp !== undefined) {
      setName(userProp.name);
      setEmail(userProp.email);
      setAvatarUrl(userProp.avatarUrl ?? null);
      return;
    }
    const token = getLocalStorageItem(TOKEN_KEY);
    const claims = token ? readJwtDisplayClaims(token) : {};
    setName(claims.name ?? "User");
    setEmail(claims.email ?? "");
    setAvatarUrl(claims.picture ?? null);
  }, [userProp]);

  const initials = initialsFromNameOrEmail(name, email);
  const currentPeriod = new Intl.DateTimeFormat(
    locale === "vi" ? "vi-VN" : "en-US",
    { month: "long", year: "numeric" },
  ).format(new Date());

  return (
    <header
      id="dashboard-top-nav"
      style={{ top: bannerInsetPx }}
      className={cn(
        "fixed right-0 z-40 flex h-16 items-center gap-2 border-b border-warm-200 bg-surface px-4 transition-[left] duration-200 ease-out motion-reduce:transition-none md:gap-3 md:px-5",
        "left-0",
        sidebarCollapsed ? "md:left-[76px]" : "md:left-[256px]")}
    >
      {onMenuClick ? (
        <button
          type="button"
          onClick={onMenuClick}
          className={cn(
            "shrink-0 rounded-button p-2 text-warm-700 md:hidden",
            "outline-none hover:bg-warm-100 hover:text-warm-900",
            "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2")}
          aria-label={tNav("openMenu")}
          aria-controls="dashboard-sidebar"
          aria-expanded={mobileMenuOpen}
        >
          <Menu className="size-5" aria-hidden />
        </button>
      ) : null}

      <nav
        className="flex min-w-0 flex-1 items-center"
        aria-label="Breadcrumb"
      >
        <ol className="flex min-w-0 flex-wrap items-center gap-1 text-sm text-warm-600">
          {crumbs.map((crumb, i) => (
            <li
              key={`${crumb.href}-${i}`}
              className={cn(
                "items-center gap-1",
                crumb.isCurrent ? "flex" : "hidden sm:flex",
              )}
            >
              {i > 0 ? (
                <ChevronRight
                  className="size-4 shrink-0 text-warm-400"
                  aria-hidden
                />
              ) : null}
              {crumb.isCurrent ? (
                <span className="truncate font-medium text-warm-900">
                  {crumbKeyByHref[crumb.href] ? tNav(crumbKeyByHref[crumb.href]) : crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="truncate transition-colors hover:text-warm-900"
                >
                  {crumbKeyByHref[crumb.href] ? tNav(crumbKeyByHref[crumb.href]) : crumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className="flex shrink-0 items-center justify-end gap-2">
        <div className="hidden items-center gap-2 border-l border-warm-200 pl-4 text-xs text-warm-600 xl:flex">
          <CalendarRange className="size-4 text-accent" aria-hidden />
          <span><span className="font-semibold text-warm-800">{tNav("currentPeriod")}:</span> {currentPeriod}</span>
        </div>
        <CommandMenu />
        <NotificationMenu />
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className={cn(
                "flex items-center gap-2 rounded-full outline-none",
                "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2")}
              aria-label={tNav("accountMenu")}
            >
              {avatarUrl ? (
                <AvatarImage
                  src={avatarUrl}
                  alt=""
                  width={36}
                  height={36}
                  className="size-9 rounded-full border border-warm-200 object-cover"
                />
              ) : (
                <span className="flex size-9 items-center justify-center rounded-full border border-warm-200 bg-accent/15 text-xs font-semibold text-warm-900">
                  {initials}
                </span>
              )}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className={cn(
                "z-[200] min-w-[240px] rounded-card border border-warm-200 bg-surface p-1 elevation-menu outline-none")}
            >
              <div className="px-2 py-2">
                <p className="truncate text-sm font-semibold text-warm-900">
                  {name}
                </p>
                {email.length > 0 ? (
                  <p className="truncate text-xs text-warm-500">{email}</p>
                ) : null}
              </div>
              <DropdownMenu.Separator className="my-1 h-px bg-warm-200" />
              <DropdownMenu.Item asChild>
                <Link
                  href={ROUTES.dashboard.profile}
                  className={cn(
                    "flex cursor-pointer select-none rounded-md px-2 py-2 text-sm text-warm-800 outline-none",
                    "hover:bg-warm-100 focus:bg-warm-100")}
                >
                  {tNav("profile")}
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link
                  href={ROUTES.dashboard.settings}
                  className={cn(
                    "flex cursor-pointer select-none rounded-md px-2 py-2 text-sm text-warm-800 outline-none",
                    "hover:bg-warm-100 focus:bg-warm-100")}
                >
                  {tNav("settings")}
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-warm-200" />
              <DropdownMenu.Item
                className={cn(
                  "flex cursor-pointer select-none rounded-md px-2 py-2 text-sm text-danger outline-none",
                  "hover:bg-warm-100 focus:bg-warm-100")}
                onSelect={(e) => {
                  e.preventDefault();
                  logout();
                }}
              >
                {tNav("logout")}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
