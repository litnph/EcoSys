"use client";

import { useEffect } from "react";

import { ROUTES } from "@/config/routes";
import { useRouter } from "@/i18n/navigation";
import { useWorkspaceStore } from "@/shared/stores/workspaceStore";

/**
 * Trả về `currentSmoduleId` từ workspace store.
 *
 * Nếu không có (`null` hoặc chuỗi rỗng), tự động redirect về
 * `/workspace-setup` để chạy lại onboarding flow.
 *
 * Hook này KHÔNG có env fallback — workspace state phải đến từ flow chuẩn.
 */
export function useSmoduleId(): string {
  const router = useRouter();
  const smoduleId = useWorkspaceStore((s) => s.currentSmoduleId);
  const isWorkspaceReady = useWorkspaceStore((s) => s.isWorkspaceReady);

  const value = smoduleId?.trim() ?? "";
  const isMissing = value.length === 0;

  useEffect(() => {
    if (!isMissing && isWorkspaceReady) {
      return;
    }
    if (!isMissing) {
      return;
    }
    const search =
      typeof window !== "undefined" ? window.location.search : "";
    const pathname =
      typeof window !== "undefined" ? window.location.pathname : "/";
    const returnUrl = encodeURIComponent(`${pathname}${search}`);
    router.replace(
      `${ROUTES.onboarding.workspaceSetup}?returnUrl=${returnUrl}`,
    );
  }, [isMissing, isWorkspaceReady, router]);

  return value;
}
