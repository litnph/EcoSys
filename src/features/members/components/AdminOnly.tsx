import type { ReactNode } from "react";

import { useRouter } from "@/i18n/navigation";
import { ROUTES } from "@/config/routes";
import { useIsAdmin } from "@/shared/hooks/useIsAdmin";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { useEffect } from "react";
import { ShieldX } from "lucide-react";

type AdminOnlyProps = {
  children: ReactNode;
  title?: string;
  description?: string;
};

export function AdminOnly({
  children,
  title = "Bạn không có quyền mở màn hình này",
  description = "Chỉ quản trị viên gia đình có thể quản lý thành viên. EcoSys đang đưa bạn về trang tổng quan.",
}: AdminOnlyProps) {
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
    return (
      <div role="status" className="mx-auto mt-10 flex max-w-xl items-start gap-4 rounded-card border border-warning/30 bg-warning/5 p-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-button border border-warning/20 text-warning">
          <ShieldX className="size-5" aria-hidden />
        </span>
        <div>
          <h1 className="text-base font-semibold text-warm-900">{title}</h1>
          <p className="mt-1 text-sm leading-6 text-warm-600">{description}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
