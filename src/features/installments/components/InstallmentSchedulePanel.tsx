import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";

import { Button } from "@/shared/components/ui/Button";
import { DataTableScrollRegion } from "@/shared/components/ui/DataTableScrollRegion";
import { formatCurrency, formatDate } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";

import type {
  InstallmentDashboard,
  InstallmentUpcomingPay,
} from "../types";
import {
  bucketBadgeClass,
  bucketLabel,
  currentMonthKey,
  filterSchedulePays,
  monthKeyLabel,
  shiftMonthKey,
  uniqueSourceOptions,
} from "../utils/installmentDisplay";

const selectClass = cn(
  "rounded-input border border-warm-200 bg-surface px-3 py-2 text-sm text-warm-900",
  "outline-none focus-visible:ring-2 focus-visible:ring-accent");

export interface InstallmentSchedulePanelProps {
  data: InstallmentDashboard | undefined;
  currency?: string;
  isLoading?: boolean;
  onOpenPlan?: (planId: string) => void;
}

function ScheduleRow({
  pay,
  currency,
  onOpenPlan,
}: {
  pay: InstallmentUpcomingPay;
  currency: string;
  onOpenPlan?: (planId: string) => void;
}) {
  const clickable = typeof onOpenPlan === "function";

  return (
    <tr
      className={cn(
        "border-t border-warm-100 text-sm",
        clickable && "cursor-pointer hover:bg-warm-50/80")}
      onClick={clickable ? () => onOpenPlan(pay.planId) : undefined}
    >
      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-warm-700">
        {formatDate(pay.statementDate)}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-warm-700">
        {formatDate(pay.dueDate)}
      </td>
      <td className="px-3 py-2.5">
        <span className="inline-flex items-center gap-1 text-warm-800">
          {pay.sourceIcon ? <span aria-hidden>{pay.sourceIcon}</span> : null}
          {pay.sourceName}
        </span>
      </td>
      <td className="max-w-[200px] truncate px-3 py-2.5 text-warm-800">
        {pay.planTitle}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-warm-600">
        {pay.installmentNumber}/{pay.totalInstallments}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 font-mono font-semibold tabular-nums text-warm-900">
        {formatCurrency(pay.amount, currency)}
      </td>
      <td className="px-3 py-2.5">
        <span
          className={cn(
            "inline-flex rounded-badge px-2 py-0.5 text-[10px] font-medium ring-1",
            bucketBadgeClass(pay.bucket))}
        >
          {bucketLabel(pay.bucket)}
        </span>
      </td>
      {clickable ? (
        <td className="px-3 py-2.5 text-right">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-11 sm:min-h-8"
            onClick={(event) => {
              event.stopPropagation();
              onOpenPlan(pay.planId);
            }}
          >
            Xem kế hoạch
          </Button>
        </td>
      ) : null}
    </tr>
  );
}

export function InstallmentSchedulePanel({
  data,
  currency = "VND",
  isLoading,
  onOpenPlan,
}: InstallmentSchedulePanelProps) {
  const [monthKey, setMonthKey] = React.useState(currentMonthKey);
  const [sourceFilter, setSourceFilter] = React.useState("all");
  const [includeOverdue, setIncludeOverdue] = React.useState(true);

  const pays = React.useMemo(
    () => data?.upcomingPays ?? [],
    [data?.upcomingPays],
  );
  const sourceOptions = React.useMemo(
    () => uniqueSourceOptions(pays),
    [pays]);

  const filtered = React.useMemo(
    () =>
      filterSchedulePays(pays, {
        monthKey,
        sourceId: sourceFilter,
        includeOverdue,
      }),
    [pays, monthKey, sourceFilter, includeOverdue]);

  const totalAmount = filtered.reduce((sum, p) => sum + p.amount, 0);
  const viewingCurrentMonth = monthKey === currentMonthKey();

  if (isLoading) {
    return (
      <div className="h-64 animate-pulse rounded-card border border-warm-200 bg-warm-50" />
    );
  }

  return (
    <div className="rounded-card border border-warm-200 bg-surface shadow-sm">
      <div className="flex flex-col gap-4 border-b border-warm-100 px-4 py-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="font-display text-sm font-semibold text-warm-900">
            Lịch thanh toán
          </h3>
          <p className="mt-0.5 text-xs text-warm-500">
            Bấm dòng để xem chi tiết kế hoạch
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-button border border-warm-200 bg-warm-50 p-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="px-2"
              aria-label="Tháng trước"
              disabled={monthKey === "all"}
              onClick={() => {
                if (monthKey !== "all") setMonthKey(shiftMonthKey(monthKey, -1));
              }}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-[7rem] px-2 text-center text-sm font-medium text-warm-800">
              {monthKeyLabel(monthKey)}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="px-2"
              aria-label="Tháng sau"
              disabled={monthKey === "all"}
              onClick={() => {
                if (monthKey !== "all") setMonthKey(shiftMonthKey(monthKey, 1));
              }}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setMonthKey(currentMonthKey())}
          >
            Tháng này
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setMonthKey("all")}
          >
            Tất cả
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-b border-warm-100 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="flex flex-col gap-1 text-xs text-warm-500">
          Thẻ
          <select
            className={selectClass}
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="all">Tất cả thẻ</option>
            {sourceOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.icon ? `${s.icon} ` : ""}
                {s.name}
              </option>
            ))}
          </select>
        </label>

        {viewingCurrentMonth ? (
          <label className="flex cursor-pointer items-center gap-2 self-end pb-2 text-sm text-warm-700">
            <input
              type="checkbox"
              className="size-4 rounded border-warm-300"
              checked={includeOverdue}
              onChange={(e) => setIncludeOverdue(e.target.checked)}
            />
            Bao gồm kỳ quá hạn
          </label>
        ) : null}

        <p className="ms-auto text-sm text-warm-600 sm:self-end sm:pb-2">
          <span className="font-medium text-warm-900">{filtered.length}</span> kỳ
          {" · "}
          <span className="font-mono font-semibold tabular-nums">
            {formatCurrency(totalAmount, currency)}
          </span>
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="px-4 py-12 text-center text-sm text-warm-400">
          Không có kỳ thanh toán trong bộ lọc này
        </p>
      ) : (
        <DataTableScrollRegion label="Lịch thanh toán trả góp theo tháng">
          <table className="w-full min-w-[760px] text-left">
            <caption className="sr-only">
              Lịch thanh toán trả góp theo tháng
            </caption>
            <thead>
              <tr className="text-xs font-medium uppercase tracking-wide text-warm-500">
                <th scope="col" className="px-3 py-2.5">Lên sao kê</th>
                <th scope="col" className="px-3 py-2.5">Hạn thanh toán</th>
                <th scope="col" className="px-3 py-2.5">Thẻ</th>
                <th scope="col" className="px-3 py-2.5">Kế hoạch</th>
                <th scope="col" className="px-3 py-2.5">Kỳ</th>
                <th scope="col" className="px-3 py-2.5">Số tiền</th>
                <th scope="col" className="px-3 py-2.5">Trạng thái</th>
                {onOpenPlan ? (
                  <th scope="col" className="px-3 py-2.5 text-right">
                    <span className="sr-only">Thao tác</span>
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {filtered.map((pay) => (
                <ScheduleRow
                  key={`${pay.planId}-${String(pay.installmentNumber)}`}
                  pay={pay}
                  currency={currency}
                  onOpenPlan={onOpenPlan}
                />
              ))}
            </tbody>
          </table>
        </DataTableScrollRegion>
      )}
    </div>
  );
}
