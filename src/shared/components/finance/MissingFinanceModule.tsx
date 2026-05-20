"use client";

import { Wallet } from "lucide-react";

import { ROUTES } from "@/config/routes";
import { Link } from "@/i18n/navigation";
import { Button } from "@/shared/components/ui/Button";

/**
 * Fallback hiển thị khi page Finance được render mà chưa có `smoduleId` trong
 * workspace store (thường do navigation nội bộ rò rỉ state). Bình thường flow
 * `RequireWorkspace` + middleware đã redirect, đây chỉ là lưới an toàn cuối.
 */
export function MissingFinanceModule() {
  return (
    <div className="mt-8 flex flex-col items-center rounded-card border border-warm-200 bg-warm-25 p-8 text-center shadow-sm">
      <span className="flex size-12 items-center justify-center rounded-full bg-accent/10 text-accent">
        <Wallet className="size-6" aria-hidden />
      </span>
      <h2 className="mt-3 font-display text-lg font-semibold text-warm-900">
        Chưa kích hoạt module Tài chính
      </h2>
      <p className="mt-2 max-w-md text-sm text-warm-600">
        Vui lòng quay lại bước cài đặt workspace để chọn tổ chức / không gian và
        kích hoạt module Tài chính.
      </p>
      <Link href={ROUTES.onboarding.workspaceSetup} className="mt-5">
        <Button type="button">Đi tới Workspace Setup</Button>
      </Link>
    </div>
  );
}
