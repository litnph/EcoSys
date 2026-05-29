import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronRight } from "lucide-react";
import { AvatarImage } from "@/shared/components/ui/AvatarImage";
import { useEffect, useState } from "react";

import { ROUTES } from "@/config/routes";
import { TOKEN_KEY } from "@/config/constants";
import { Link, usePathname } from "@/i18n/navigation";
import { buildDashboardBreadcrumbs } from "@/shared/lib/dashboard-breadcrumb";
import {
  initialsFromNameOrEmail,
  readJwtDisplayClaims,
} from "@/shared/lib/jwt-display";
import { getLocalStorageItem, logout } from "@/shared/lib/auth-session";
import { cn } from "@/shared/lib/utils";

export type TopNavUser = {
  name: string;
  email: string;
  avatarUrl?: string | null;
};

export type TopNavProps = {
  sidebarCollapsed: boolean;
  user?: TopNavUser;
  bannerInsetPx?: number;
};

export function TopNav({
  sidebarCollapsed,
  user: userProp,
  bannerInsetPx = 0,
}: TopNavProps) {
  const pathname = usePathname();
  const crumbs = buildDashboardBreadcrumbs(pathname);

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

  return (
    <header
      style={{ top: bannerInsetPx }}
      className={cn(
        "fixed right-0 z-40 flex h-14 items-center gap-3 border-b border-warm-200 bg-warm-25/80 px-6 backdrop-blur transition-[left] duration-200 ease-out",
        sidebarCollapsed ? "left-16" : "left-[240px]")}
    >
      <nav
        className="flex min-w-0 flex-1 items-center"
        aria-label="Breadcrumb"
      >
        <ol className="flex min-w-0 flex-wrap items-center gap-1 text-sm text-warm-600">
          {crumbs.map((crumb, i) => (
            <li key={`${crumb.href}-${i}`} className="flex items-center gap-1">
              {i > 0 ? (
                <ChevronRight
                  className="size-4 shrink-0 text-warm-400"
                  aria-hidden
                />
              ) : null}
              {crumb.isCurrent ? (
                <span className="truncate font-medium text-warm-900">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="truncate transition-colors hover:text-warm-900"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className="flex shrink-0 items-center justify-end gap-2">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className={cn(
                "flex items-center gap-2 rounded-full outline-none",
                "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2")}
              aria-label="Account menu"
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
                "z-[200] min-w-[220px] rounded-card border border-warm-200 bg-surface p-1 shadow-lg outline-none")}
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
                  Profile
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link
                  href={ROUTES.dashboard.settings}
                  className={cn(
                    "flex cursor-pointer select-none rounded-md px-2 py-2 text-sm text-warm-800 outline-none",
                    "hover:bg-warm-100 focus:bg-warm-100")}
                >
                  Settings
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
                Logout
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
