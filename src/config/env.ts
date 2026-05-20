export const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export const NEXT_PUBLIC_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const NEXT_PUBLIC_APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME ?? "Personal Finance";

/** Optional default finance SpaceModule id until space selection exists (dashboard). */
export const NEXT_PUBLIC_FINANCE_SMODULE_ID =
  process.env.NEXT_PUBLIC_FINANCE_SMODULE_ID ?? "";

/**
 * ngrok free tier may return an HTML interstitial unless this header is present
 * (browser + Edge middleware fetches).
 */
export function getNgrokSkipBrowserWarningHeaders(
  apiBase: string = NEXT_PUBLIC_API_URL): Record<string, string> {
  const raw = apiBase.trim().replace(/\/$/, "");
  if (!raw) return {};
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return u.hostname.toLowerCase().includes("ngrok")
      ? { "ngrok-skip-browser-warning": "true" }
      : {};
  } catch {
    return {};
  }
}
