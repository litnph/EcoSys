import {
  LOCALE_KEY,
  REFRESH_TOKEN_KEY,
  TOKEN_KEY,
  WORKSPACE_ORG_KEY,
  WORKSPACE_SMODULE_KEY,
  WORKSPACE_SPACE_KEY,
} from "@/config/constants";
import { ROUTES } from "@/config/routes";

import { clearAuthCookies } from "./auth-cookies";
import { clearWorkspaceCookies } from "./workspace-cookies";

export function getLocalStorageItem(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getPreferredLocale(): string {
  return getLocalStorageItem(LOCALE_KEY) ?? "vi";
}

export function clearAuthTokens(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.localStorage.removeItem(WORKSPACE_ORG_KEY);
    window.localStorage.removeItem(WORKSPACE_SPACE_KEY);
    window.localStorage.removeItem(WORKSPACE_SMODULE_KEY);
  } catch {
    /* ignore */
  }
  clearAuthCookies();
  clearWorkspaceCookies();
}

export function redirectToLogin(): void {
  if (typeof window === "undefined") {
    return;
  }
  const locale = getPreferredLocale();
  const loginPath = `/${locale}${ROUTES.auth.login}`;
  window.location.assign(loginPath);
}

export function logout(): void {
  clearAuthTokens();
  redirectToLogin();
}
