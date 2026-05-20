"use client";

import { useEffect } from "react";

import { TOKEN_KEY } from "@/config/constants";
import { useRouter } from "@/i18n/navigation";
import { getLocalStorageItem } from "@/shared/lib/auth-session";
import {
  getReturnUrlFromSearch,
  resolvePostAuthPath,
} from "@/shared/lib/returnUrl";

/**
 * Client guard: if an access token exists, send the user to the dashboard.
 */
export function RedirectIfAuthenticated() {
  const router = useRouter();

  useEffect(() => {
    const token = getLocalStorageItem(TOKEN_KEY);
    if (token) {
      router.replace(resolvePostAuthPath(getReturnUrlFromSearch()));
    }
  }, [router]);

  return null;
}
