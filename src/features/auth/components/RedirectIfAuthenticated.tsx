"use client";

import { useEffect } from "react";

import { ROUTES } from "@/config/routes";
import { TOKEN_KEY } from "@/config/constants";
import { useRouter } from "@/i18n/navigation";
import { getLocalStorageItem } from "@/shared/lib/auth-session";

/**
 * Client guard: if an access token exists, send the user to the dashboard.
 */
export function RedirectIfAuthenticated() {
  const router = useRouter();

  useEffect(() => {
    const token = getLocalStorageItem(TOKEN_KEY);
    if (token) {
      router.replace(ROUTES.dashboard.home);
    }
  }, [router]);

  return null;
}
