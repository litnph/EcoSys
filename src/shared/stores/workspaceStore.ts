"use client";

import { create } from "zustand";

import {
  WORKSPACE_ORG_KEY,
  WORKSPACE_SMODULE_KEY,
  WORKSPACE_SPACE_KEY,
} from "@/config/constants";
import type { Organization } from "@/features/organizations/types";
import type { Space } from "@/features/spaces/types";

import { clearWorkspaceCookies, syncWorkspaceCookies } from "@/shared/lib/workspace-cookies";

/**
 * Workspace context của user hiện tại — quản lý cặp `(Organization, Space, SpaceModule)`
 * mà toàn bộ Finance features dùng (`smoduleId`).
 *
 * Quy tắc lifecycle:
 * - Sau đăng nhập, user vào `/organizations` (quản lý tổ chức). Khi mở Finance,
 *   có thể đi qua `/workspace-setup` để chọn org → space → module nếu chưa có context.
 * - `isWorkspaceReady=true` ↔ có đủ `currentOrg`, `currentSpace`, `currentSmoduleId`.
 * - Mọi mutation đều mirror sang `localStorage` + cookie cùng tên — middleware đọc cookie
 *   để biết có cần redirect onboarding hay không.
 */

interface PersistedSnapshot {
  orgId: string | null;
  spaceId: string | null;
  smoduleId: string | null;
}

export interface WorkspaceState {
  currentOrg: Organization | null;
  currentSpace: Space | null;
  currentSmoduleId: string | null;
  isWorkspaceReady: boolean;

  /** Danh sách orgs đã load (cho OrgSwitcher / OrgSelector). */
  orgs: Organization[];
  /** Cây spaces của org hiện tại (cho SpaceSelector / SpaceInfo). */
  spaceTree: Space[];

  setCurrentOrg: (org: Organization | null) => void;
  setCurrentSpace: (space: Space | null) => void;
  setSmoduleId: (id: string | null) => void;
  setWorkspaceReady: (ready: boolean) => void;
  setOrgs: (orgs: Organization[]) => void;
  setSpaceTree: (tree: Space[]) => void;
  /** Reset toàn bộ context + xoá persisted state. */
  resetWorkspace: () => void;
  /** Nạp lại các giá trị persisted (id only) từ localStorage. Không gọi API. */
  hydrateFromStorage: () => PersistedSnapshot;
}

function readLocal(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(key);
    return v && v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (value === null || value.length === 0) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
  } catch {
    /* ignore */
  }
}

function snapshotFromStorage(): PersistedSnapshot {
  return {
    orgId: readLocal(WORKSPACE_ORG_KEY),
    spaceId: readLocal(WORKSPACE_SPACE_KEY),
    smoduleId: readLocal(WORKSPACE_SMODULE_KEY),
  };
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  currentOrg: null,
  currentSpace: null,
  currentSmoduleId: null,
  isWorkspaceReady: false,
  orgs: [],
  spaceTree: [],

  setCurrentOrg: (org) => {
    writeLocal(WORKSPACE_ORG_KEY, org?.id ?? null);
    syncWorkspaceCookies({ orgId: org?.id ?? null });
    set({ currentOrg: org });
  },

  setCurrentSpace: (space) => {
    writeLocal(WORKSPACE_SPACE_KEY, space?.id ?? null);
    syncWorkspaceCookies({ spaceId: space?.id ?? null });
    set({ currentSpace: space });
  },

  setSmoduleId: (id) => {
    const trimmed = id && id.trim().length > 0 ? id.trim() : null;
    writeLocal(WORKSPACE_SMODULE_KEY, trimmed);
    syncWorkspaceCookies({ smoduleId: trimmed });
    set({ currentSmoduleId: trimmed });
  },

  setWorkspaceReady: (ready) => set({ isWorkspaceReady: ready }),

  setOrgs: (orgs) => set({ orgs }),
  setSpaceTree: (tree) => set({ spaceTree: tree }),

  resetWorkspace: () => {
    writeLocal(WORKSPACE_ORG_KEY, null);
    writeLocal(WORKSPACE_SPACE_KEY, null);
    writeLocal(WORKSPACE_SMODULE_KEY, null);
    clearWorkspaceCookies();
    set({
      currentOrg: null,
      currentSpace: null,
      currentSmoduleId: null,
      isWorkspaceReady: false,
      orgs: [],
      spaceTree: [],
    });
  },

  hydrateFromStorage: () => snapshotFromStorage(),
}));

/** Đọc giá trị `currentSmoduleId` đồng bộ — dùng trong axios interceptor, v.v. */
export function getCurrentSmoduleIdSync(): string | null {
  return useWorkspaceStore.getState().currentSmoduleId;
}
