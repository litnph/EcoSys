import { REFRESH_TOKEN_KEY, TOKEN_KEY } from "@/config/constants";

function buildCookiePair(name: string, value: string, maxAgeSec: number): string {
  const encName = encodeURIComponent(name);
  const encVal = encodeURIComponent(value);
  return `${encName}=${encVal}; Path=/; SameSite=Lax; Max-Age=${Math.max(0, Math.floor(maxAgeSec))}`;
}

/** Removes legacy JavaScript-readable token cookies; Bearer auth uses local storage only. */
export function clearAuthCookies(): void {
  if (typeof document === "undefined") {
    return;
  }
  document.cookie = buildCookiePair(TOKEN_KEY, "", 0);
  document.cookie = buildCookiePair(REFRESH_TOKEN_KEY, "", 0);
}
