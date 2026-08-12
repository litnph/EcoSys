import { CreditCard, Eye } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/components/ui/Button";
import { formatCurrency } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";

import type {
  MonthlyReportBillingCycleItem,
  MonthlyReportBillingCycleStatus,
  MonthlyReportBillingCyclesSection,
} from "../types";

import { BillingCycleReportDetailModal } from "./BillingCycleReportDetailModal";

export interface BillingCyclesReportSectionProps {
  section: MonthlyReportBillingCyclesSection | undefined;
  isLoading: boolean;
  className?: string;
}

function statusBadgeClasses(status: MonthlyReportBillingCycleStatus): string {
  switch (status) {
    case "open":
      return "bg-accent/15 text-accent ring-1 ring-accent/30";
    case "closed":
      return "bg-warm-100 text-warm-600 ring-1 ring-warm-200";
    case "paid":
      return "bg-success/15 text-success ring-1 ring-success/25";
    case "overdue":
      return "bg-danger/15 text-danger ring-1 ring-danger/25";
    default:
      return "bg-warm-100 text-warm-600";
  }
}

function statusLabel(status: MonthlyReportBillingCycleStatus): string {
  switch (status) {
    case "open":
      return "Đang mở";
    case "closed":
      return "Đã đóng";
    case "paid":
      return "Đã thanh toán";
    case "overdue":
      return "Quá hạn";
    default:
      return status;
  }
}

function cycleDisplayName(cycle: MonthlyReportBillingCycleItem): string {
  const trimmed = cycle.name?.trim();
  if (trimmed) return trimmed;
  const month = new Date(`${cycle.statementDate}T12:00:00`).getMonth() + 1;
  return `Kỳ sao kê tháng ${String(month)}`;
}

function CycleBlock({
  cycle,
  onViewDetail,
}: {
  cycle: MonthlyReportBillingCycleItem;
  onViewDetail: (cycle: MonthlyReportBillingCycleItem) => void;
}) {
  const txnCount = cycle.transactions.length;
  const installmentCount = cycle.installmentDues.length;

  return (
    <article className="flex items-center gap-3 rounded-lg border border-warm-200 bg-surface px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-semibold text-warm-900">
          {cycleDisplayName(cycle)}
        </p>
        <p className="truncate text-xs text-warm-500">{cycle.sourceName}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-mono text-sm font-semibold tabular-nums text-warm-900">
            {formatCurrency(cycle.totalAmount, cycle.currency)}
          </span>
          <span className="text-xs text-warm-400" aria-hidden>
            ·
          </span>
          <span className="text-xs tabular-nums text-warm-500">
            {txnCount} giao dịch · {installmentCount} trả góp
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span
          className={cn(
            "inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            statusBadgeClasses(cycle.status),
          )}
        >
          {statusLabel(cycle.status)}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-11 shrink-0 px-0 sm:size-8"
          aria-label="Xem chi tiết kỳ sao kê"
          onClick={() => onViewDetail(cycle)}
        >
          <Eye className="size-4" aria-hidden />
        </Button>
      </div>
    </article>
  );
}

export function BillingCyclesReportSection({
  section,
  isLoading,
  className,
}: BillingCyclesReportSectionProps) {
  const [detailCycle, setDetailCycle] =
    useState<MonthlyReportBillingCycleItem | null>(null);

  if (isLoading) {
    return (
      <section
        className={cn(
          "rounded-card border border-warm-200 bg-surface shadow-sm",
          className,
        )}
      >
        <header className="border-b border-warm-100 px-4 py-3">
          <div className="h-5 w-48 animate-pulse rounded bg-warm-100" />
        </header>
        <div className="space-y-2 p-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-warm-50" />
          ))}
        </div>
      </section>
    );
  }

  const cycles = section?.cycles ?? [];
  const total = section?.totalAmount ?? 0;
  const count = section?.cycleCount ?? cycles.length;
  const installmentTotal = cycles.reduce(
    (sum, cycle) =>
      sum + cycle.installmentDues.reduce((s, due) => s + due.amount, 0),
    0,
  );
  const cardSpendTotal = cycles.reduce(
    (sum, cycle) =>
      sum + cycle.transactions.reduce((s, txn) => s + txn.amount, 0),
    0,
  );

  return (
    <>
      <section
        className={cn(
          "rounded-card border border-warm-200 bg-surface shadow-sm",
          className,
        )}
      >
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-warm-100 px-4 py-3">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <CreditCard className="size-4" aria-hidden />
            </span>
            <div>
              <h2 className="font-display text-sm font-semibold text-warm-900">
                Kỳ sao kê thẻ
              </h2>
              <p className="mt-0.5 text-xs text-warm-500">
                Phát hành trong tháng báo cáo — gồm chi quẹt thẻ và trả góp đến hạn.
              </p>
            </div>
          </div>
        </header>

        <div className="border-b border-warm-100 bg-warm-50/60 px-4 py-2.5 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-warm-600">
              <span className="font-semibold tabular-nums text-warm-900">{count}</span>{" "}
              kỳ sao kê
            </p>
            <p className="font-mono font-semibold tabular-nums text-warm-900">
              {formatCurrency(total, cycles[0]?.currency ?? "VND")}
            </p>
          </div>
          <p className="mt-1 text-[11px] text-warm-500">
            Quẹt thẻ {formatCurrency(cardSpendTotal, cycles[0]?.currency ?? "VND")} · Trả góp{" "}
            {formatCurrency(installmentTotal, cycles[0]?.currency ?? "VND")}
          </p>
        </div>

        {cycles.length === 0 ? (
          <p className="px-4 py-6 text-sm text-warm-500">
            Không có kỳ sao kê nào phát hành trong tháng này.
          </p>
        ) : (
          <div className="space-y-2 p-4">
            {cycles.map((cycle) => (
              <CycleBlock
                key={cycle.id}
                cycle={cycle}
                onViewDetail={setDetailCycle}
              />
            ))}
          </div>
        )}
      </section>

      <BillingCycleReportDetailModal
        cycle={detailCycle}
        isOpen={detailCycle !== null}
        onClose={() => setDetailCycle(null)}
      />
    </>
  );
}
