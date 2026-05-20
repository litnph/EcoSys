"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { switchOrganization } from "@/features/auth/api/authApi";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { getMyOrganizations } from "@/features/organizations/api/organizationsApi";
import type { Organization } from "@/features/organizations/types";
import {
  enableModule as enableModuleApi,
  findFirstFinanceSpace,
  getSpaceModules,
  getSpaceTree,
  resolveFinanceSmoduleId,
} from "@/features/spaces/api/spacesApi";
import { FINANCE_MODULE_CODE, type Space } from "@/features/spaces/types";

import { useWorkspaceStore } from "@/shared/stores/workspaceStore";

/** Loại lỗi để màn `/workspace-setup` hiển thị message phù hợp. */
export type WorkspaceInitErrorKind =
  | "no-orgs"
  | "timeout"
  | "network"
  | "unknown";

export interface WorkspaceInitError {
  kind: WorkspaceInitErrorKind;
  message: string;
}

/** Bước hiện tại — driver của UI trong `/workspace-setup`. */
export type WorkspaceInitStatus =
  | "idle"
  | "loading"
  | "needs-org-selection"
  | "needs-space-selection"
  | "needs-module-setup"
  | "ready"
  | "error";

export interface UseWorkspaceInitResult {
  status: WorkspaceInitStatus;
  isLoading: boolean;
  error: WorkspaceInitError | null;
  orgs: Organization[];
  spaceTree: Space[];
  currentOrg: Organization | null;
  currentSpace: Space | null;
  /** User chọn 1 org từ `OrgSelector`. Sẽ trigger Bước 3. */
  selectOrg: (org: Organization) => Promise<void>;
  /** User chọn 1 space từ `SpaceSelector`. Sẽ trigger Bước 4. */
  selectSpace: (space: Space) => Promise<void>;
  /** Gọi từ `ModuleSetup` để enable finance. */
  enableFinance: () => Promise<void>;
  /** Chạy lại flow từ đầu (retry, hoặc khi storage thay đổi cross-tab). */
  retry: () => void;
}

const STEP_TIMEOUT_MS = 10_000;

class TimeoutError extends Error {
  constructor() {
    super("Workspace init timeout");
    this.name = "TimeoutError";
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new TimeoutError()), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e: unknown) => {
        clearTimeout(t);
        reject(e instanceof Error ? e : new Error(String(e)));
      },
    );
  });
}

function classifyError(e: unknown): WorkspaceInitError {
  if (e instanceof TimeoutError) {
    return {
      kind: "timeout",
      message: "Không thể tải workspace, thử lại",
    };
  }
  if (e instanceof Error) {
    const msg = e.message;
    if (/Network|kết nối|fetch failed|ECONN|ENOTFOUND/i.test(msg)) {
      return {
        kind: "network",
        message: "Không thể kết nối đến server, vui lòng thử lại",
      };
    }
    return { kind: "unknown", message: msg };
  }
  return { kind: "unknown", message: "Đã có lỗi không xác định" };
}

/**
 * Hook hợp nhất logic onboarding:
 *
 * - Bước 1: `getMyOrganizations` → nếu chỉ 1 org thì auto chọn, nhiều thì
 *   `status="needs-org-selection"`. Nếu rỗng → `kind="no-orgs"`.
 * - Bước 2: `getSpaceTree(orgId)` → nếu chỉ 1 root space thì auto, nhiều thì
 *   `status="needs-space-selection"`.
 * - Bước 3: `getSpaceModules(spaceId)` → tìm finance enabled, set smoduleId.
 *   Nếu finance chưa enable → `status="needs-module-setup"`.
 * - Bước 4: tất cả thoả → `status="ready"`. Caller redirect ra `/dashboard`.
 *
 * Mỗi step có timeout 10 giây.
 */
export function useWorkspaceInit(): UseWorkspaceInitResult {
  const orgs = useWorkspaceStore((s) => s.orgs);
  const spaceTree = useWorkspaceStore((s) => s.spaceTree);
  const currentOrg = useWorkspaceStore((s) => s.currentOrg);
  const currentSpace = useWorkspaceStore((s) => s.currentSpace);
  const setOrgs = useWorkspaceStore((s) => s.setOrgs);
  const setSpaceTree = useWorkspaceStore((s) => s.setSpaceTree);
  const setCurrentOrg = useWorkspaceStore((s) => s.setCurrentOrg);
  const setCurrentSpace = useWorkspaceStore((s) => s.setCurrentSpace);
  const setSmoduleId = useWorkspaceStore((s) => s.setSmoduleId);
  const setWorkspaceReady = useWorkspaceStore((s) => s.setWorkspaceReady);
  const resetWorkspace = useWorkspaceStore((s) => s.resetWorkspace);
  const hydrateFromStorage = useWorkspaceStore((s) => s.hydrateFromStorage);

  const [status, setStatus] = useState<WorkspaceInitStatus>("idle");
  const [error, setError] = useState<WorkspaceInitError | null>(null);
  const runIdRef = useRef(0);

  const resolveModulesForSpace = useCallback(
    async (space: Space): Promise<void> => {
      const modulesResp = await withTimeout(
        getSpaceModules(space.id),
        STEP_TIMEOUT_MS,
      );
      const smoduleId = resolveFinanceSmoduleId(modulesResp.data);
      if (smoduleId) {
        setSmoduleId(smoduleId);
        setWorkspaceReady(true);
        setStatus("ready");
        return;
      }
      setSmoduleId(null);
      setWorkspaceReady(false);
      setStatus("needs-module-setup");
    },
    [setSmoduleId, setWorkspaceReady],
  );

  const resolveSpacesForOrg = useCallback(
    async (org: Organization, savedSpaceId: string | null): Promise<void> => {
      const treeResp = await withTimeout(getSpaceTree(org.id), STEP_TIMEOUT_MS);
      const roots = treeResp.data;
      setSpaceTree(roots);

      const flat = flattenSpaces(roots);
      const fromSaved = savedSpaceId
        ? flat.find((s) => s.id === savedSpaceId)
        : null;

      // Ưu tiên: saved → space đã enable finance → root duy nhất → cần chọn.
      const candidate =
        fromSaved ?? findFirstFinanceSpace(roots) ?? (roots.length === 1 ? roots[0] : null);

      if (!candidate) {
        setCurrentSpace(null);
        setStatus("needs-space-selection");
        return;
      }

      setCurrentSpace(candidate);
      await resolveModulesForSpace(candidate);
    },
    [resolveModulesForSpace, setCurrentSpace, setSpaceTree],
  );

  const runInit = useCallback(async (): Promise<void> => {
    const myRunId = ++runIdRef.current;
    setError(null);
    setStatus("loading");

    try {
      const snapshot = hydrateFromStorage();

      const orgsResp = await withTimeout(getMyOrganizations(), STEP_TIMEOUT_MS);
      if (runIdRef.current !== myRunId) return;
      const orgList = orgsResp.data;
      setOrgs(orgList);

      if (orgList.length === 0) {
        setError({
          kind: "no-orgs",
          message:
            "Tài khoản của bạn chưa có tổ chức nào, vui lòng liên hệ hỗ trợ",
        });
        setStatus("error");
        return;
      }

      const personal = orgList.find((o) => o.isPersonal);
      const savedOrg = snapshot.orgId
        ? orgList.find((o) => o.id === snapshot.orgId)
        : null;
      const candidateOrg =
        savedOrg ?? (orgList.length === 1 ? orgList[0] : personal ?? null);

      if (!candidateOrg) {
        setCurrentOrg(null);
        setStatus("needs-org-selection");
        return;
      }

      setCurrentOrg(candidateOrg);
      const tokens = await switchOrganization(candidateOrg.id);
      useAuthStore.getState().setTokens(tokens.data.accessToken, tokens.data.refreshToken);
      await resolveSpacesForOrg(candidateOrg, snapshot.spaceId);
    } catch (e) {
      if (runIdRef.current !== myRunId) return;
      const classified = classifyError(e);
      setError(classified);
      setStatus("error");
    }
  }, [
    hydrateFromStorage,
    resolveSpacesForOrg,
    setCurrentOrg,
    setOrgs,
  ]);

  const selectOrg = useCallback(
    async (org: Organization): Promise<void> => {
      setError(null);
      setStatus("loading");
      setCurrentOrg(org);
      setCurrentSpace(null);
      setSmoduleId(null);
      setWorkspaceReady(false);
      try {
        const tokens = await switchOrganization(org.id);
        useAuthStore.getState().setTokens(tokens.data.accessToken, tokens.data.refreshToken);
        await resolveSpacesForOrg(org, null);
      } catch (e) {
        setError(classifyError(e));
        setStatus("error");
      }
    },
    [
      resolveSpacesForOrg,
      setCurrentOrg,
      setCurrentSpace,
      setSmoduleId,
      setWorkspaceReady,
    ],
  );

  const selectSpace = useCallback(
    async (space: Space): Promise<void> => {
      setError(null);
      setStatus("loading");
      setCurrentSpace(space);
      setSmoduleId(null);
      setWorkspaceReady(false);
      try {
        await resolveModulesForSpace(space);
      } catch (e) {
        setError(classifyError(e));
        setStatus("error");
      }
    },
    [
      resolveModulesForSpace,
      setCurrentSpace,
      setSmoduleId,
      setWorkspaceReady,
    ],
  );

  const enableFinance = useCallback(async (): Promise<void> => {
    const space = useWorkspaceStore.getState().currentSpace;
    if (!space) {
      setError({
        kind: "unknown",
        message: "Chưa có space được chọn, vui lòng quay lại bước trước",
      });
      setStatus("error");
      return;
    }
    setError(null);
    setStatus("loading");
    try {
      const resp = await withTimeout(
        enableModuleApi(space.id, FINANCE_MODULE_CODE),
        STEP_TIMEOUT_MS,
      );
      if (resp.data.isEnabled) {
        setSmoduleId(resp.data.id);
        setWorkspaceReady(true);
        setStatus("ready");
        return;
      }
      setError({
        kind: "unknown",
        message: "Không thể kích hoạt module Tài chính, vui lòng thử lại",
      });
      setStatus("error");
    } catch (e) {
      setError(classifyError(e));
      setStatus("error");
    }
  }, [setSmoduleId, setWorkspaceReady]);

  const retry = useCallback((): void => {
    resetWorkspace();
    void runInit();
  }, [resetWorkspace, runInit]);

  useEffect(() => {
    void runInit();
    // Chỉ chạy 1 lần khi mount; selectOrg/selectSpace/enableFinance/retry sẽ
    // điều khiển các step kế tiếp.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    status,
    isLoading: status === "loading" || status === "idle",
    error,
    orgs,
    spaceTree,
    currentOrg,
    currentSpace,
    selectOrg,
    selectSpace,
    enableFinance,
    retry,
  };
}

function flattenSpaces(nodes: Space[]): Space[] {
  const out: Space[] = [];
  function walk(list: Space[]): void {
    for (const n of list) {
      out.push(n);
      if (n.children && n.children.length > 0) walk(n.children);
    }
  }
  walk(nodes);
  return out;
}
