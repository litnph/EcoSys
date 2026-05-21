"use client";

import type { ReactNode } from "react";
import { useEffect, useLayoutEffect, useState } from "react";
import { useLocale } from "next-intl";

import { ROUTES } from "@/config/routes";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { usePathname, useRouter } from "@/i18n/navigation";

type DashboardAuthGateProps = {
  children: ReactNode;
};

export function DashboardAuthGate({ children }: DashboardAuthGateProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrateFromStorage = useAuthStore((s) => s.hydrateFromStorage);
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    hydrateFromStorage();
    setMounted(true);
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (!mounted || isAuthenticated) {
      return;
    }
    const path =
      pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
    const search = window.location.search.replace(/^\?/, "");
    const returnUrl = search ? `${path}?${search}` : path;
    router.replace(
      `${ROUTES.auth.login}?returnUrl=${encodeURIComponent(returnUrl)}`);
  }, [mounted, isAuthenticated, locale, pathname, router]);

  if (!mounted) {
    return (
      <div
        className="min-h-[40vh] w-full max-w-[1400px] animate-pulse space-y-6 pb-8"
        aria-busy="true"
        aria-hidden
      />
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
