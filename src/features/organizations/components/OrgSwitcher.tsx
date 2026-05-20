"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Building2, Check, ChevronDown } from "lucide-react";

import { switchOrganization } from "@/features/auth/api/authApi";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { useWorkspaceStore } from "@/shared/stores/workspaceStore";
import { cn } from "@/shared/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { ROUTES } from "@/config/routes";

function initialsOf(name: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

export type OrgSwitcherProps = {
  /** Khi true, chỉ hiển thị avatar (cho sidebar collapsed). */
  compact?: boolean;
};

/**
 * Dropdown chọn org ở đầu Sidebar.
 *
 * Khi user chọn org khác:
 * - reset spaceId + smoduleId trong store
 * - persist orgId mới
 * - redirect `/workspace-setup` để chạy lại flow chọn space + module cho org mới
 */
export function OrgSwitcher({ compact = false }: OrgSwitcherProps) {
  const router = useRouter();
  const orgs = useWorkspaceStore((s) => s.orgs);
  const currentOrg = useWorkspaceStore((s) => s.currentOrg);
  const setCurrentOrg = useWorkspaceStore((s) => s.setCurrentOrg);
  const setCurrentSpace = useWorkspaceStore((s) => s.setCurrentSpace);
  const setSmoduleId = useWorkspaceStore((s) => s.setSmoduleId);
  const setWorkspaceReady = useWorkspaceStore((s) => s.setWorkspaceReady);
  const setSpaceTree = useWorkspaceStore((s) => s.setSpaceTree);

  if (orgs.length === 0 && !currentOrg) {
    return null;
  }

  const name = currentOrg?.name ?? "Tổ chức";
  const initials = initialsOf(name);

  async function handleSelect(orgId: string): Promise<void> {
    const next = orgs.find((o) => o.id === orgId);
    if (!next || next.id === currentOrg?.id) return;
    try {
      const tokens = await switchOrganization(next.id);
      useAuthStore.getState().setTokens(tokens.data.accessToken, tokens.data.refreshToken);
    } catch {
      return;
    }
    setCurrentOrg(next);
    setCurrentSpace(null);
    setSmoduleId(null);
    setSpaceTree([]);
    setWorkspaceReady(false);
    router.push(ROUTES.onboarding.workspaceSetup);
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Chọn tổ chức"
          className={cn(
            "flex w-full items-center gap-2 rounded-button border border-warm-200 bg-surface px-2 py-2 text-left text-sm text-warm-900 outline-none",
            "hover:bg-warm-100 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
            compact && "justify-center px-0",
          )}
        >
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold uppercase",
              currentOrg?.isPersonal
                ? "bg-accent text-white"
                : "bg-warm-100 text-warm-700",
            )}
            aria-hidden
          >
            {initials.length > 0 ? initials : <Building2 className="size-4" />}
          </span>
          {!compact ? (
            <>
              <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate font-medium text-warm-900">
                  {name}
                </span>
                {currentOrg?.isPersonal ? (
                  <span className="truncate text-[11px] text-warm-500">
                    Cá nhân
                  </span>
                ) : currentOrg?.slug ? (
                  <span className="truncate text-[11px] text-warm-500">
                    {currentOrg.slug}
                  </span>
                ) : null}
              </span>
              <ChevronDown
                className="size-4 shrink-0 text-warm-500"
                aria-hidden
              />
            </>
          ) : null}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={8}
          className="z-[200] min-w-[240px] rounded-card border border-warm-200 bg-surface p-1 shadow-lg outline-none"
        >
          <DropdownMenu.Label className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-warm-500">
            Tổ chức của bạn
          </DropdownMenu.Label>
          {orgs.map((org) => {
            const isActive = org.id === currentOrg?.id;
            return (
              <DropdownMenu.Item
                key={org.id}
                onSelect={(e) => {
                  e.preventDefault();
                  handleSelect(org.id);
                }}
                className={cn(
                  "flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-2 text-sm outline-none",
                  "hover:bg-warm-100 focus:bg-warm-100",
                  isActive && "bg-accent/10",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold",
                    org.isPersonal
                      ? "bg-accent text-white"
                      : "bg-warm-100 text-warm-700",
                  )}
                  aria-hidden
                >
                  {initialsOf(org.name) || <Building2 className="size-3.5" />}
                </span>
                <span className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span className="truncate font-medium text-warm-900">
                    {org.name}
                  </span>
                  <span className="truncate text-[11px] text-warm-500">
                    {org.isPersonal ? "Cá nhân" : org.slug}
                  </span>
                </span>
                {isActive ? (
                  <Check className="size-4 shrink-0 text-accent" aria-hidden />
                ) : null}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
