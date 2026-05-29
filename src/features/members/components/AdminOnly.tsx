import type { ReactNode } from "react";

import { useRouter } from "@/i18n/navigation";
import { ROUTES } from "@/config/routes";
import { useIsAdmin } from "@/shared/hooks/useIsAdmin";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { useEffect } from "react";

export function AdminOnly({ children }: { children: ReactNode }) {
  const isAdmin = useIsAdmin();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (user && !isAdmin) {
      router.replace(ROUTES.dashboard.home);
    }
  }, [user, isAdmin, router]);

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
