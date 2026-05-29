import { RefreshCw, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { formatCurrency, formatDate } from "@/shared/lib/formatters";
import { cardHoverMotion } from "@/shared/lib/animations";
import { cn } from "@/shared/lib/utils";

import type { BillingCycle, BillingCycleStatus } from "../types";
import {
  billingCycleDisplayName,
  billingCyclePeriodLabel,
} from "../utils/billingCycleDisplay";

function statusBadgeClasses(status: BillingCycleStatus): string {
  switch (status) {
    case "open":
      return "bg-accent/15 text-accent ring-1 ring-accent/30";
    case "closed":
      return "bg-warm-100 text-warm-500 ring-1 ring-warm-200";
    case "paid":
      return "bg-success/15 text-success ring-1 ring-success/25";
    case "overdue":
      return "bg-danger/15 text-danger ring-1 ring-danger/25";
    default:
      return "";
  }
}

function statusLabel(status: BillingCycleStatus): string {
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

function calendarDaysBetweenUtc(start: Date, end: Date): number {
  const s = Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate());
  const e = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  return Math.floor((e - s) / 86_400_000);
}

function overdueDays(paymentDueDate: string, today = new Date()): number {
  const due = new Date(`${paymentDueDate}T00:00:00Z`);
  const t = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  return calendarDaysBetweenUtc(due, t);
}

export interface BillingCycleCardProps {
  cycle: BillingCycle;
  currency: string;
  onOpenDetail: (cycle: BillingCycle) => void;
  onPay: (cycle: BillingCycle) => void;
  onCloseCycle: (cycle: BillingCycle) => void;
  onRefresh?: (cycle: BillingCycle) => void;
  isRefreshing?: boolean;
  onDelete?: (cycle: BillingCycle) => void;
}

export function BillingCycleCard({
  cycle,
  currency,
  onOpenDetail,
  onPay,
  onCloseCycle,
  onRefresh,
  isRefreshing = false,
  onDelete,
}: BillingCycleCardProps) {
  const total = Math.max(0, cycle.totalAmount);
  const paid = Math.max(0, cycle.paidAmount);
  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 1000) / 10) : 0;
  const isOverdue = cycle.status === "overdue";
  const daysLate = isOverdue ? overdueDays(cycle.paymentDueDate) : 0;
  const showOverdueCopy = isOverdue && daysLate > 0;

  const title = billingCycleDisplayName(cycle);
  const periodLabel = billingCyclePeriodLabel(cycle);
  const canDelete = cycle.status === "open" && cycle.paidAmount <= 0;

  return (
    <motion.article
      {...cardHoverMotion}
      className={cn(
        "flex flex-col gap-4 rounded-card border border-warm-200 bg-surface p-4 shadow-sm transition hover:border-warm-300")}
    >
      <button
        type="button"
        onClick={() => onOpenDetail(cycle)}
        className="flex w-full flex-col gap-2 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-display text-base font-semibold text-warm-900">
              {title}
            </h3>
            <p className="text-sm text-warm-600">
              {cycle.sourceName} · {periodLabel}
            </p>
          </div>
          <Badge
            size="sm"
            className={cn("shrink-0 capitalize", statusBadgeClasses(cycle.status))}
          >
            {statusLabel(cycle.status)}
          </Badge>
        </div>

        <div className="space-y-1">
          <div
            className={cn(
              "h-2 w-full overflow-hidden rounded-full bg-warm-100")}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all",
                isOverdue ? "bg-danger" : "bg-accent")}
              style={{ width: `${String(pct)}%` }}
            />
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-warm-500">Tổng phát sinh</dt>
            <dd className="font-mono font-semibold tabular-nums text-warm-900">
              {formatCurrency(total, currency)}
            </dd>
          </div>
          <div>
            <dt className="text-warm-500">Đã thanh toán</dt>
            <dd className="font-mono font-semibold tabular-nums text-warm-900">
              {formatCurrency(paid, currency)}
            </dd>
          </div>
        </dl>

        <div className="text-sm">
          <span className="text-warm-500">Hạn thanh toán: </span>
          <span
            className={cn(
              "font-medium tabular-nums",
              showOverdueCopy ? "text-danger" : "text-warm-800")}
          >
            {formatDate(cycle.paymentDueDate)}
            {showOverdueCopy ? (
              <span className="ml-2">
                · Quá hạn {String(daysLate)} ngày
              </span>
            ) : null}
          </span>
        </div>
      </button>

      <div className="flex flex-wrap gap-2 border-t border-warm-100 pt-3">
        {cycle.status === "open" ? (
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="flex-1 min-w-[140px]"
              leftIcon={<RefreshCw className="size-4" aria-hidden />}
              isLoading={isRefreshing}
              onClick={() => onRefresh?.(cycle)}
            >
              Làm mới
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="flex-1 min-w-[140px]"
              onClick={() => onCloseCycle(cycle)}
            >
              Đóng kỳ sao kê
            </Button>
            {canDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-danger hover:bg-danger/10"
                leftIcon={<Trash2 className="size-4" aria-hidden />}
                onClick={() => onDelete?.(cycle)}
              >
                Xóa
              </Button>
            ) : null}
          </>
        ) : null}
        {cycle.status === "closed" || cycle.status === "overdue" ? (
          <Button
            type="button"
            size="sm"
            className="flex-1 min-w-[140px]"
            onClick={() => onPay(cycle)}
          >
            Thanh toán
          </Button>
        ) : null}
      </div>
    </motion.article>
  );
}
