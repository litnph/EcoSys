import { ROUTES } from "@/config/routes";

const BLOCKED_PREFIXES = ["/login"];

/** Reads `returnUrl` from the current page query (client-only). */
export function getReturnUrlFromSearch(search?: string): string | null {
  if (typeof window === "undefined" && !search) {
    return null;
  }
  const raw = search ?? window.location.search;
  const value = new URLSearchParams(raw).get("returnUrl");
  return sanitizeReturnUrl(value);
}

/** Strips locale prefix and blocks auth routes. */
export function sanitizeReturnUrl(path: string | null | undefined): string | null {
  if (!path?.trim()) {
    return null;
  }
  let p = path.trim();
  if (!p.startsWith("/")) {
    p = `/${p}`;
  }
  const segments = p.split("/").filter(Boolean);
  if (segments.length > 0 && (segments[0] === "en" || segments[0] === "vi")) {
    segments.shift();
    p = segments.length === 0 ? "/" : `/${segments.join("/")}`;
  }
  const lower = p.toLowerCase();
  if (BLOCKED_PREFIXES.some((b) => lower === b || lower.startsWith(`${b}?`) || lower.startsWith(`${b}/`))) {
    return null;
  }
  return p;
}

/** After login, default to finance dashboard. */
export function resolvePostAuthPath(returnUrl: string | null): string {
  return returnUrl ?? ROUTES.dashboard.home;
}
