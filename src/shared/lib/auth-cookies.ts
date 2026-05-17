import { REFRESH_TOKEN_KEY, TOKEN_KEY } from "@/config/constants";

import { getJwtExpiryUnixSeconds } from "./jwt";

function buildCookiePair(name: string, value: string, maxAgeSec: number): string {
  const encName = encodeURIComponent(name);
  const encVal = encodeURIComponent(value);
  return `${encName}=${encVal}; Path=/; SameSite=Lax; Max-Age=${Math.max(0, Math.floor(maxAgeSec))}`;
}

export function setAuthCookies(accessToken: string, refreshToken: string): void {
  if (typeof document === "undefined") {
    return;
  }
  const now = Math.floor(Date.now() / 1000);
  const accessClaims = getJwtExpiryUnixSeconds(accessToken);
  const accessMax = accessClaims ? Math.max(60, accessClaims - now) : 900;
  const refreshClaims = getJwtExpiryUnixSeconds(refreshToken);
  const refreshMax = refreshClaims
    ? Math.max(3600, refreshClaims - now)
    : 60 * 60 * 24 * 14;
  document.cookie = buildCookiePair(TOKEN_KEY, accessToken, accessMax);
  document.cookie = buildCookiePair(REFRESH_TOKEN_KEY, refreshToken, refreshMax);
}

export function clearAuthCookies(): void {
  if (typeof document === "undefined") {
    return;
  }
  document.cookie = buildCookiePair(TOKEN_KEY, "", 0);
  document.cookie = buildCookiePair(REFRESH_TOKEN_KEY, "", 0);
}
