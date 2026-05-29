import type { ReactNode } from "react";
import { useEffect, useLayoutEffect, useState } from "react";
import { useLocale } from "@/i18n/navigation";

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

  if (!mounted || !isAuthenticated) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-warm-50"
        aria-busy={!mounted}
        aria-label={mounted ? "Đang chuyển hướng" : "Đang tải"}
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-warm-200 border-t-accent" />
      </div>
    );
  }

  return <>{children}</>;
}
