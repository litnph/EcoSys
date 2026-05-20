"use client";

import { useEffect, useRef } from "react";

import { ROUTES } from "@/config/routes";
import { REFRESH_TOKEN_KEY, TOKEN_KEY } from "@/config/constants";
import { refreshToken as refreshTokenRequest } from "@/features/auth/api/authApi";
import { useBootstrapUser } from "@/features/auth/hooks/useBootstrapUser";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { useRouter } from "@/i18n/navigation";
import { setAuthCookies } from "@/shared/lib/auth-cookies";
import { getLocalStorageItem } from "@/shared/lib/auth-session";
import { shouldProactiveRefresh } from "@/shared/lib/jwt";

const TICK_MS = 60_000;

/**
 * One-time sync so middleware (cookies) stays aligned with an existing localStorage session.
 */
function syncCookiesFromStorage(): void {
  const access = getLocalStorageItem(TOKEN_KEY);
  const refresh = getLocalStorageItem(REFRESH_TOKEN_KEY);
  if (access && refresh) {
    setAuthCookies(access, refresh);
  }
}

async function silentRefresh(): Promise<boolean> {
  const refresh = getLocalStorageItem(REFRESH_TOKEN_KEY);
  if (!refresh) {
    return false;
  }
  const body = await refreshTokenRequest(refresh);
  const { accessToken, refreshToken } = body.data;
  useAuthStore.getState().setTokens(accessToken, refreshToken);
  return true;
}

/**
 * Keeps access/refresh cookies aligned with localStorage and proactively refreshes before expiry.
 * Rendered under `[locale]/layout` (inside NextIntlClientProvider) so `useRouter` from `@/i18n/navigation` is valid.
 */
export function SessionManager() {
  const router = useRouter();
  const loggedSync = useRef(false);
  useBootstrapUser();

  useEffect(() => {
    if (loggedSync.current) {
      return;
    }
    loggedSync.current = true;
    syncCookiesFromStorage();
  }, []);

  useEffect(() => {
    const run = async () => {
      const access = getLocalStorageItem(TOKEN_KEY);
      const refresh = getLocalStorageItem(REFRESH_TOKEN_KEY);
      if (!shouldProactiveRefresh(access, refresh)) {
        return;
      }
      try {
        await silentRefresh();
      } catch {
        useAuthStore.getState().clearAuth();
        router.replace(ROUTES.auth.login);
      }
    };

    void run();
    const id = window.setInterval(() => {
      void run();
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [router]);

  return null;
}
