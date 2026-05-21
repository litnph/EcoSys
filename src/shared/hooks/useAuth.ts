"use client";

import { useCallback, useLayoutEffect } from "react";

import { ROUTES } from "@/config/routes";
import { logout as authApiLogout } from "@/features/auth/api/authApi";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { useRouter } from "@/i18n/navigation";

export function useAuth() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrateFromStorage = useAuthStore((s) => s.hydrateFromStorage);

  useLayoutEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  const logout = useCallback(async () => {
    await authApiLogout();
    router.replace(ROUTES.auth.login);
  }, [router]);

  return {
    user,
    isAuthenticated,
    isLoading: false,
    logout,
  };
}
