import {
  WORKSPACE_ORG_KEY,
  WORKSPACE_SMODULE_KEY,
  WORKSPACE_SPACE_KEY,
} from "@/config/constants";

const ONE_YEAR_SEC = 60 * 60 * 24 * 365;

function setCookie(name: string, value: string, maxAgeSec: number): void {
  if (typeof document === "undefined") {
    return;
  }
  const encName = encodeURIComponent(name);
  const encVal = encodeURIComponent(value);
  document.cookie = `${encName}=${encVal}; Path=/; SameSite=Lax; Max-Age=${Math.max(
    0,
    Math.floor(maxAgeSec),
  )}`;
}

/**
 * Mirror các workspace key vào cookie để Edge middleware có thể đọc
 * (middleware không truy cập `localStorage`).
 *
 * Truyền `null` để xoá cookie tương ứng.
 */
export function syncWorkspaceCookies(values: {
  orgId?: string | null;
  spaceId?: string | null;
  smoduleId?: string | null;
}): void {
  if (typeof document === "undefined") {
    return;
  }
  if (values.orgId !== undefined) {
    setCookie(WORKSPACE_ORG_KEY, values.orgId ?? "", values.orgId ? ONE_YEAR_SEC : 0);
  }
  if (values.spaceId !== undefined) {
    setCookie(
      WORKSPACE_SPACE_KEY,
      values.spaceId ?? "",
      values.spaceId ? ONE_YEAR_SEC : 0,
    );
  }
  if (values.smoduleId !== undefined) {
    setCookie(
      WORKSPACE_SMODULE_KEY,
      values.smoduleId ?? "",
      values.smoduleId ? ONE_YEAR_SEC : 0,
    );
  }
}

export function clearWorkspaceCookies(): void {
  syncWorkspaceCookies({ orgId: null, spaceId: null, smoduleId: null });
}
