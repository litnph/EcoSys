"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

import { ROUTES } from "@/config/routes";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { useFeatureFlags } from "@/features/feature-flags/hooks/useFeatureFlags";
import { getMyOrganizations } from "@/features/organizations/api/organizationsApi";
import {
  getSpaceModules,
  getSpaceTree,
  resolveFinanceSmoduleId,
} from "@/features/spaces/api/spacesApi";
import { useRouter, usePathname } from "@/i18n/navigation";
import {
  WORKSPACE_ORG_KEY,
  WORKSPACE_SMODULE_KEY,
  WORKSPACE_SPACE_KEY,
} from "@/config/constants";
import { useWorkspaceStore } from "@/shared/stores/workspaceStore";

type RequireWorkspaceProps = {
  children: ReactNode;
  /** Loading fallback khi đang verify state. */
  fallback?: ReactNode;
};

/**
 * Route guard cho group `(dashboard)`.
 *
 * Logic:
 * - Nếu store đã `isWorkspaceReady=true` → render children.
 * - Nếu store rỗng nhưng có persisted ids → verify từng id qua API
 *   (`/organizations`, `/spaces/tree`, `/spaces/{id}/modules`). Nếu hợp lệ →
 *   nạp lại store. Nếu không hợp lệ → reset + redirect `/workspace-setup`.
 * - Trong khi verify: render `fallback`.
 *
 * Edge case 3 — đổi org ở tab khác: listen `storage` event và reload trang nếu
 * `pfp_current_org_id` thay đổi.
 */
export function RequireWorkspace({ children, fallback }: RequireWorkspaceProps) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();
  const pathname = usePathname();

  const isWorkspaceReady = useWorkspaceStore((s) => s.isWorkspaceReady);
  const setOrgs = useWorkspaceStore((s) => s.setOrgs);
  const setCurrentOrg = useWorkspaceStore((s) => s.setCurrentOrg);
  const setSpaceTree = useWorkspaceStore((s) => s.setSpaceTree);
  const setCurrentSpace = useWorkspaceStore((s) => s.setCurrentSpace);
  const setSmoduleId = useWorkspaceStore((s) => s.setSmoduleId);
  const setWorkspaceReady = useWorkspaceStore((s) => s.setWorkspaceReady);
  const resetWorkspace = useWorkspaceStore((s) => s.resetWorkspace);
  const hydrateFromStorage = useWorkspaceStore((s) => s.hydrateFromStorage);

  const verifyStartedRef = useRef(false);

  // Feature flags vẫn cần fetch sau khi auth — giữ behavior cũ.
  useFeatureFlags(Boolean(user) || isAuthenticated);

  function redirectToSetup(): void {
    const search =
      typeof window !== "undefined" ? window.location.search : "";
    const pathNorm = pathname === "/" ? "/" : pathname;
    const returnUrl = encodeURIComponent(`${pathNorm}${search}`);
    router.replace(
      `${ROUTES.onboarding.workspaceSetup}?returnUrl=${returnUrl}`,
    );
  }

  useEffect(() => {
    if (isWorkspaceReady) {
      return;
    }
    if (verifyStartedRef.current) {
      return;
    }
    verifyStartedRef.current = true;

    const snapshot = hydrateFromStorage();
    if (!snapshot.orgId || !snapshot.spaceId || !snapshot.smoduleId) {
      redirectToSetup();
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const orgsResp = await getMyOrganizations();
        if (cancelled) return;
        const orgs = orgsResp.data;
        setOrgs(orgs);
        const org = orgs.find((o) => o.id === snapshot.orgId);
        if (!org) {
          resetWorkspace();
          redirectToSetup();
          return;
        }
        setCurrentOrg(org);

        const treeResp = await getSpaceTree(org.id);
        if (cancelled) return;
        const tree = treeResp.data;
        setSpaceTree(tree);

        const flat: { id: string; node: typeof tree[number] }[] = [];
        (function walk(list: typeof tree): void {
          for (const n of list) {
            flat.push({ id: n.id, node: n });
            if (n.children && n.children.length > 0) walk(n.children);
          }
        })(tree);

        const space = flat.find((x) => x.id === snapshot.spaceId)?.node;
        if (!space) {
          resetWorkspace();
          redirectToSetup();
          return;
        }
        setCurrentSpace(space);

        const modulesResp = await getSpaceModules(space.id);
        if (cancelled) return;
        const validSmoduleId = resolveFinanceSmoduleId(modulesResp.data);
        if (!validSmoduleId || validSmoduleId !== snapshot.smoduleId) {
          // Module đã bị disable hoặc id không còn khớp → bắt buộc onboarding lại.
          resetWorkspace();
          redirectToSetup();
          return;
        }
        setSmoduleId(validSmoduleId);
        setWorkspaceReady(true);
      } catch {
        if (cancelled) return;
        resetWorkspace();
        redirectToSetup();
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWorkspaceReady]);

  // Edge case 3: storage event từ tab khác → reload trạng thái.
  useEffect(() => {
    function onStorage(ev: StorageEvent): void {
      if (
        ev.key === WORKSPACE_ORG_KEY ||
        ev.key === WORKSPACE_SPACE_KEY ||
        ev.key === WORKSPACE_SMODULE_KEY
      ) {
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!isWorkspaceReady) {
    return (
      fallback ?? (
        <div
          className="min-h-screen bg-warm-50"
          aria-busy="true"
          aria-label="Đang tải workspace"
        />
      )
    );
  }

  return <>{children}</>;
}
