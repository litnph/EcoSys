"use client";

import { AlertTriangle, Lock } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";

import type { BillingCycle } from "@/features/billing-cycles/types";
import { billingCyclesBlockingCloseMonth } from "../utils/blockingCycles";
import type { MonthlyPeriodStatus } from "../types";
import { CloseMonthConfirmModal } from "./CloseMonthConfirmModal";

export interface CloseMonthSectionProps {
  smoduleId: string | undefined;
  year: number;
  month: number;
  status: MonthlyPeriodStatus;
  billingCycles: BillingCycle[] | undefined;
  isCyclesLoading?: boolean;
}

export function CloseMonthSection({
  smoduleId,
  year,
  month,
  status,
  billingCycles,
  isCyclesLoading,
}: CloseMonthSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const blockers = useMemo(
    () => billingCyclesBlockingCloseMonth(year, month, billingCycles ?? []),
    [billingCycles, month, year],
  );

  const uniqueNames = useMemo(
    () =>
      Array.from(new Set(blockers.map((b) => b.sourceName))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [blockers],
  );

  if (status === "closed") {
    return (
      <section className="mt-10 flex flex-col gap-4 rounded-card border border-warm-200 bg-warm-25/60 p-5 shadow-inner">
        <div className="flex flex-wrap items-center gap-3">
          <Lock className="size-5 text-warm-600" aria-hidden />
          <h3 className="font-display text-base font-semibold text-warm-900">
            Tháng đã chốt
          </h3>
          <Badge variant="success" size="md">
            Đã chốt
          </Badge>
        </div>
        <p className="text-sm leading-relaxed text-warm-600">
          Chỉ số tháng này đã được cố định. Chi tiết vẫn xem được ở biểu đồ và tổng quan phía trên.
        </p>
      </section>
    );
  }

  const disabledClosing = blockers.length > 0;

  return (
    <>
      <section className="mt-10 flex flex-col gap-4 rounded-card border border-warm-200 bg-surface p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-display text-base font-semibold text-warm-900">
              Đóng sổ tháng
            </h3>
            <p className="mt-1 max-w-xl text-sm text-warm-600">
              Sau khi chốt tháng, hệ thống ghi nhận chỉ số hiện tại và yêu cầu không còn kỳ sao kê thẻ tin dụng mở nợ trong tháng.
            </p>
          </div>
          <Button
            type="button"
            className="shrink-0"
            disabled={
              disabledClosing ||
              isCyclesLoading ||
              !smoduleId?.trim()?.length
            }
            leftIcon={<Lock className="size-4" aria-hidden />}
            onClick={() => setModalOpen(true)}
          >
            Chốt tháng
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
            </div>
          </div>
        ) : null}
      </section>

      <CloseMonthConfirmModal
        smoduleId={smoduleId}
        year={year}
        month={month}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
