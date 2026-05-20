"use client";

import { useCallback, useState } from "react";

import { switchOrganization } from "@/features/auth/api/authApi";
import { useAuthStore } from "@/features/auth/stores/authStore";
import {
  findFirstFinanceSpace,
  getSpaceModules,
  getSpaceTree,
  resolveFinanceSmoduleId,
} from "@/features/spaces/api/spacesApi";
import { ROUTES } from "@/config/routes";
import { useRouter } from "@/i18n/navigation";
import { useWorkspaceStore } from "@/shared/stores/workspaceStore";

import type { Organization } from "../types";

/**
 * Chuyển JWT sang org đích, resolve space + finance smodule, rồi vào dashboard.
 * Nếu chưa bật finance → `/workspace-setup`.
 */
export function useEnterFinanceWorkspace() {
  const router = useRouter();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setCurrentOrg = useWorkspaceStore((s) => s.setCurrentOrg);
  const setSpaceTree = useWorkspaceStore((s) => s.setSpaceTree);
  const setCurrentSpace = useWorkspaceStore((s) => s.setCurrentSpace);
  const setSmoduleId = useWorkspaceStore((s) => s.setSmoduleId);
  const setWorkspaceReady = useWorkspaceStore((s) => s.setWorkspaceReady);
  const [isPending, setIsPending] = useState(false);

  const enter = useCallback(
    async (org: Organization, spaceId?: string | null) => {
      setIsPending(true);
      try {
        const tokens = await switchOrganization(org.id);
        setTokens(tokens.data.accessToken, tokens.data.refreshToken);
        setCurrentOrg(org);

        const treeResp = await getSpaceTree(org.id);
        const roots = treeResp.data;
        setSpaceTree(roots);

        const flat: typeof roots = [];
        const walk = (nodes: typeof roots) => {
          for (const n of nodes) {
            flat.push(n);
            if (n.children?.length) walk(n.children);
          }
        };
        walk(roots);

        const space =
          (spaceId ? flat.find((s) => s.id === spaceId) : null) ??
          findFirstFinanceSpace(roots) ??
          (roots.length === 1 ? roots[0] : null);

        if (!space) {
          setWorkspaceReady(false);
          router.push(
            `${ROUTES.onboarding.workspaceSetup}?returnUrl=${encodeURIComponent(ROUTES.dashboard.home)}`,
          );
          return;
        }

        setCurrentSpace(space);
        const modulesResp = await getSpaceModules(space.id);
        const smoduleId = resolveFinanceSmoduleId(modulesResp.data);

        if (!smoduleId) {
          setSmoduleId(null);
          setWorkspaceReady(false);
          router.push(
            `${ROUTES.onboarding.workspaceSetup}?returnUrl=${encodeURIComponent(ROUTES.dashboard.home)}`,
          );
          return;
        }

        setSmoduleId(smoduleId);
        setWorkspaceReady(true);
        router.push(ROUTES.dashboard.home);
      } finally {
        setIsPending(false);
      }
    },
    [
      router,
      setCurrentOrg,
      setCurrentSpace,
      setSmoduleId,
      setSpaceTree,
      setTokens,
      setWorkspaceReady,
    ],
  );

  return { enter, isPending };
}
