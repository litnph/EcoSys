import { AlertTriangle, Lock } from "lucide-react";
import { useMemo, useState } from "react";

import { ROUTES } from "@/config/routes";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";

import type { BillingCycle } from "@/features/billing-cycles/types";
import { billingCyclesBlockingCloseMonth } from "../utils/blockingCycles";
import type { MonthlyPeriodStatus } from "../types";
import { currentUtcYearMonth } from "../utils/months";
import { CloseMonthConfirmModal } from "./CloseMonthConfirmModal";

export interface CloseMonthSectionProps {
  year: number;
  month: number;
  status: MonthlyPeriodStatus;
  billingCycles: BillingCycle[] | undefined;
  isCyclesLoading?: boolean;
  onClosed?: () => void;
}

export function CloseMonthSection({
  year,
  month,
  status,
  billingCycles,
  isCyclesLoading,
  onClosed,
}: CloseMonthSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const blockers = useMemo(
    () => billingCyclesBlockingCloseMonth(year, month, billingCycles ?? []),
    [billingCycles, month, year]);

  const isFutureMonth = useMemo(() => {
    const now = currentUtcYearMonth();
    return year > now.year || (year === now.year && month > now.month);
  }, [month, year]);

  const uniqueNames = useMemo(
    () =>
      Array.from(new Set(blockers.map((b) => b.sourceName))).sort((a, b) =>
        a.localeCompare(b)),
    [blockers]);

  if (status === "closed") {
    return (
      <section className="flex flex-col gap-4 rounded-card border border-warm-200 bg-warm-25/60 p-5 shadow-inner">
        <div className="flex flex-wrap items-center gap-3">
          <Lock className="size-5 text-warm-600" aria-hidden />
          <h3 className="font-display text-base font-semibold text-warm-900">
            Báo cáo đã chốt
          </h3>
          <Badge variant="success" size="md">
            Đã chốt
          </Badge>
        </div>
        <p className="text-sm leading-relaxed text-warm-600">
          Báo cáo tháng này đã được cố định. Dữ liệu không còn cập nhật được nữa.
        </p>
      </section>
    );
  }

  if (isFutureMonth) {
    return (
      <section className="flex flex-col gap-3 rounded-card border border-warm-200 bg-warm-25/60 p-5 shadow-inner">
        <h3 className="font-display text-base font-semibold text-warm-900">
          Chốt báo cáo tháng
        </h3>
        <p className="text-sm leading-relaxed text-warm-600">
          Báo cáo tháng tương lai chỉ dùng để theo dõi dự kiến. Bạn có thể cập nhật dữ liệu,
          nhưng chưa thể chốt cho đến khi tháng đó bắt đầu.
        </p>
      </section>
    );
  }

  const disabledClosing = blockers.length > 0;

  return (
    <>
      <section className="flex flex-col gap-4 rounded-card border border-warm-200 bg-surface p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-display text-base font-semibold text-warm-900">
              Chốt báo cáo tháng
            </h3>
            <p className="mt-1 max-w-xl text-sm text-warm-600">
              Sau khi chốt, báo cáo được đóng băng và không thể cập nhật thêm. Yêu cầu không còn kỳ sao kê thẻ mở nợ trong tháng.
            </p>
          </div>
          <Button
            type="button"
            className="shrink-0"
            disabled={disabledClosing || isCyclesLoading}
            leftIcon={<Lock className="size-4" aria-hidden />}
            onClick={() => setModalOpen(true)}
          >
            Chốt báo cáo
          </Button>
        </div>

        {disabledClosing ? (
          <div
            className="flex gap-3 rounded-button border border-warning/35 bg-warning/10 p-3 text-sm text-warm-800"
            role="alert"
          >
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
            <div>
              <p className="font-medium text-warm-900">
                Vẫn còn {blockers.length} kỳ sao kê chưa được đóng hoặc chưa thanh toán.
              </p>
              <p className="mt-2 text-xs text-warm-700 md:text-sm">
                Thẻ: <span className="font-semibold">{uniqueNames.join(", ")}</span>
              </p>
              <p className="mt-2 text-xs text-warm-600">
                Vào{" "}
                <Link
                  href={ROUTES.dashboard.billing}
                  className="font-medium text-accent hover:underline"
                >
                  Thẻ &amp; sao kê
                </Link>
                , chọn từng kỳ có kết thúc trong tháng {month}/{year}, bấm{" "}
                <strong>Đóng kỳ</strong> (và thanh toán nếu cần), rồi quay lại chốt báo cáo.
              </p>
            </div>
          </div>
        ) : null}
      </section>

      <CloseMonthConfirmModal
        year={year}
        month={month}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onClosed={onClosed}
      />
    </>
  );
}
