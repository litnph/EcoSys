function decodeJwtPayloadJson(token: string): unknown | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) {
      return null;
    }
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = normalized.length % 4;
    const padded =
      pad === 0 ? normalized : normalized + "=".repeat(4 - pad);
    return JSON.parse(atob(padded)) as unknown;
  } catch {
    return null;
  }
}

/**
 * Best-effort JWT payload read (no signature verification). Used for expiry checks only.
 */
export function getJwtExpiryUnixSeconds(token: string): number | null {
  const json = decodeJwtPayloadJson(token);
  if (json === null || typeof json !== "object" || json === null) {
    return null;
  }
  const exp = (json as { exp?: unknown }).exp;
  return typeof exp === "number" ? exp : null;
}

/** Refresh-session id claim minted by the API (`sid`). */
export function getSessionIdFromAccessToken(token: string | null): string | null {
  if (!token) {
    return null;
  }
  const json = decodeJwtPayloadJson(token);
  if (json === null || typeof json !== "object" || json === null) {
    return null;
  }
  const sid = (json as { sid?: unknown }).sid;
  return typeof sid === "string" && sid.length > 0 ? sid : null;
}

export function isAccessTokenValid(token: string | null): boolean {
  if (!token) {
    return false;
  }
  const exp = getJwtExpiryUnixSeconds(token);
  if (exp === null) {
    return false;
  }
  return exp > Math.floor(Date.now() / 1000);
}

/** True when access is missing/invalid/expired or expires within 2 minutes, and a refresh token exists. */
export function shouldProactiveRefresh(
  accessToken: string | null,
  refreshToken: string | null): boolean {
  if (!refreshToken) {
    return false;
  }
  if (!accessToken) {
    return true;
  }
  const exp = getJwtExpiryUnixSeconds(accessToken);
  if (exp === null) {
    return true;
  }
  const now = Math.floor(Date.now() / 1000);
  if (exp <= now) {
    return true;
  }
  return exp - now < 120;
}
