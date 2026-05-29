export const VITE_API_URL = import.meta.env.VITE_API_URL ?? "";

export const VITE_APP_URL =
  import.meta.env.VITE_APP_URL ?? "http://localhost:3000";

export const VITE_APP_NAME =
  import.meta.env.VITE_APP_NAME ?? "Personal Finance";

/** @deprecated Use VITE_API_URL */
export const NEXT_PUBLIC_API_URL = VITE_API_URL;

/**
 * ngrok free tier may return an HTML interstitial unless this header is present.
 */
export function getNgrokSkipBrowserWarningHeaders(
  apiBase: string = VITE_API_URL): Record<string, string> {
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
