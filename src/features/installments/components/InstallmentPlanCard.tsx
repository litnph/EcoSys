"use client";

import { Link } from "@/i18n/navigation";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

import { ROUTES } from "@/config/routes";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { cn } from "@/shared/lib/utils";
import { cardHoverMotion } from "@/shared/lib/animations";
import { formatCurrency, formatDate } from "@/shared/lib/formatters";

import type {
  InstallmentPlan,
  InstallmentPlanListItem,
  InstallmentStatus,
} from "../types";

function statusBadgeClasses(status: InstallmentStatus): string {
  switch (status) {
    case "active":
      return "bg-accent/15 text-accent ring-1 ring-accent/30";
    case "completed":
      return "bg-success/15 text-success ring-1 ring-success/25";
    case "cancelled":
      return "bg-warm-100 text-warm-400 ring-1 ring-warm-200";
    default:
      return "";
  }
}

function statusLabel(status: InstallmentStatus): string {
  switch (status) {
    case "active":
      return "Đang trả";
    case "completed":
      return "Hoàn tất";
    case "cancelled":
      return "Đã hủy";
    default:
      return status;
  }
}

function conversionFeeBadge(
  status: NonNullable<InstallmentPlan["conversionFeeStatus"]>): { label: string; className: string } {
  switch (status) {
    case "pending":
      return {
        label: "Phí chuyển đổi · Chờ",
        className: "bg-amber-100 text-amber-900 ring-1 ring-amber-200",
      };
    case "billed":
      return {
        label: "Phí chuyển đổi · Đã ghi",
        className: "bg-accent/10 text-accent ring-1 ring-accent/25",
      };
    case "paid":
      return {
        label: "Phí chuyển đổi · Đã trả",
        className: "bg-success/15 text-success ring-1 ring-success/20",
      };
    default:
      return { label: "", className: "" };
  }
}

export interface InstallmentPlanCardProps {
  listItem: InstallmentPlanListItem;
  plan: InstallmentPlan | null;
  isDetailLoading: boolean;
  currency: string;
  isExpanded: boolean;
  onToggle: () => void;
  onCancel?: () => void;
}

export function InstallmentPlanCard({
  listItem,
  plan,
  isDetailLoading,
  currency,
  isExpanded,
  onToggle,
  onCancel,
}: InstallmentPlanCardProps) {
  const title =
    plan?.originalTxnDescription?.trim() ||
    listItem.originalTxnDescription?.trim() ||
    "Giao dịch gốc";
  const originalTxnId = plan?.originalTxnId;

  const paid = listItem.paidInstallments;
  const total = listItem.totalInstallments;
  const pct =
    total > 0 ? Math.min(100, Math.round((paid / total) * 1000) / 10) : 0;

  const totalAmount = plan?.totalAmount;
  const monthlyAmount = plan?.monthlyAmount;

  const showFeeBadge =
    plan?.conversionFeeStatus != null &&
    plan.conversionFeeAmount != null &&
    plan.conversionFeeAmount > 0;

  const canCancel =
    listItem.status === "active" && typeof onCancel === "function";

  return (
    <motion.article
      {...cardHoverMotion}
      className={cn(
        "flex flex-col gap-4 rounded-card border border-warm-200 bg-surface p-4 shadow-sm transition",
        isExpanded ? "border-accent/40 ring-1 ring-accent/15" : "hover:border-warm-300")}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="min-w-0 flex-1 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <div className="flex items-start gap-2">
              <h3 className="min-w-0 flex-1 font-display text-base font-semibold text-warm-900">
                {originalTxnId ? (
                  <Link
                    href={{
                      pathname: ROUTES.dashboard.transactions,
                      query: { highlight: originalTxnId },
                    }}
                    className="inline-flex items-center gap-1 underline decoration-warm-300 underline-offset-2 hover:text-accent"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="truncate">{title}</span>
                  </Link>
                ) : (
                  <span className="truncate">{title}</span>
                )}
              </h3>
              <ChevronDown
                className={cn(
                  "mt-0.5 size-5 shrink-0 text-warm-500 transition-transform",
                  isExpanded && "rotate-180")}
                aria-hidden
              />
            </div>
            {listItem.sourceName ? (
              <p className="mt-1 text-sm text-warm-600">{listItem.sourceName}</p>
            ) : null}
          </button>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {showFeeBadge && plan?.conversionFeeStatus ? (
              <Badge
                size="sm"
                className={conversionFeeBadge(plan.conversionFeeStatus).className}
              >
                {conversionFeeBadge(plan.conversionFeeStatus).label}
              </Badge>
            ) : null}
            <Badge
              size="sm"
              className={cn(
                "shrink-0 capitalize",
                statusBadgeClasses(listItem.status))}
            >
              {statusLabel(listItem.status)}
            </Badge>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-warm-500">Tổng tiền</dt>
            <dd className="font-mono font-semibold tabular-nums text-warm-900">
              {isDetailLoading && totalAmount === undefined ? (
                <span className="inline-block h-5 w-28 animate-pulse rounded bg-warm-100" />
              ) : typeof totalAmount === "number" ? (
                formatCurrency(totalAmount, currency)
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-warm-500">Mỗi kỳ</dt>
            <dd className="font-mono font-semibold tabular-nums text-warm-900">
              {isDetailLoading && monthlyAmount === undefined ? (
                <span className="inline-block h-5 w-24 animate-pulse rounded bg-warm-100" />
              ) : typeof monthlyAmount === "number" ? (
                formatCurrency(monthlyAmount, currency)
              ) : (
                "—"
              )}
            </dd>
          </div>
        </dl>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm text-warm-600">
            <span>
              Đã trả {String(paid)}/{String(total)} kỳ
            </span>
            <span className="tabular-nums">{String(pct)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-warm-100">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${String(pct)}%` }}
            />
          </div>
        </div>

        {plan?.startDate ? (
          <p className="text-xs text-warm-500">
            Bắt đầu:{" "}
            <span className="font-medium text-warm-700">
              {formatDate(plan.startDate)}
            </span>
          </p>
        ) : null}
      </div>

      {canCancel ? (
        <div className="flex flex-wrap gap-2 border-t border-warm-100 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-warm-600"
            onClick={(e) => {
              e.stopPropagation();
              onCancel?.();
            }}
          >
            Hủy kế hoạch
          </Button>
        </div>
      ) : null}
    </motion.article>
  );
}
