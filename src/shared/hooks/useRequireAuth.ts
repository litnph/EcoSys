"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";

import { ROUTES } from "@/config/routes";
import { usePathname, useRouter } from "@/i18n/navigation";

import { useAuth } from "./useAuth";

/**
 * Client guard for dashboard routes. Redirects to login with returnUrl when unauthenticated.
 */
export function useRequireAuth(): { isReady: boolean } {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (isAuthenticated) {
      return;
    }
    const path =
      pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
    const search = window.location.search.replace(/^\?/, "");
    const returnUrl = search ? `${path}?${search}` : path;
    router.replace(
      `${ROUTES.auth.login}?returnUrl=${encodeURIComponent(returnUrl)}`);
  }, [isAuthenticated, isLoading, locale, pathname, router]);

  const isReady = !isLoading && isAuthenticated;
  return { isReady };
}
