import { Trash2 } from "lucide-react";
import { motion } from "framer-motion";

import { sourceTypeIcon } from "@/features/dashboard/utils/financeDisplay";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { cn } from "@/shared/lib/utils";
import { cardHoverMotion } from "@/shared/lib/animations";
import { formatCurrency } from "@/shared/lib/formatters";

import type { InstallmentPlanListItem, InstallmentStatus } from "../types";
import { sourceCardTintColor } from "../utils/sourceCardTint";

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

function planTitle(listItem: InstallmentPlanListItem): string {
  return (
    listItem.originalTxnCategoryName?.trim() ||
    listItem.originalTxnDescription?.trim() ||
    "Trả góp"
  );
}

export interface InstallmentPlanCardProps {
  listItem: InstallmentPlanListItem;
  currency: string;
  onOpenDetail: () => void;
  onDelete?: () => void;
}

export function InstallmentPlanCard({
  listItem,
  currency,
  onOpenDetail,
  onDelete,
}: InstallmentPlanCardProps) {
  const title = planTitle(listItem);
  const description = listItem.originalTxnDescription?.trim() ?? "";
  const showDescription =
    description.length > 0 && description !== title.trim();

  const paid = listItem.paidInstallments;
  const total = listItem.totalInstallments;
  const pct =
    total > 0 ? Math.min(100, Math.round((paid / total) * 1000) / 10) : 0;

  const tint = sourceCardTintColor(listItem.sourceColor);
  const iconChar = listItem.sourceIcon?.trim();
  const FallbackIcon = sourceTypeIcon("creditCard");

  return (
    <motion.article
      {...cardHoverMotion}
      role="button"
      tabIndex={0}
      onClick={onOpenDetail}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenDetail();
        }
      }}
      className={cn(
        "flex cursor-pointer flex-col gap-2 rounded-card border border-warm-200/80 p-3 shadow-sm transition outline-none",
        "hover:border-warm-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-accent")}
      style={{ backgroundColor: tint }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface/80 text-base ring-1 ring-warm-200/60"
            aria-hidden
          >
            {iconChar ? (
              <span>{iconChar}</span>
            ) : (
              <FallbackIcon className="size-4 text-warm-600" />
            )}
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-display text-sm font-semibold text-warm-900">
              {title}
            </h3>
            {showDescription ? (
              <p className="mt-0.5 line-clamp-2 text-xs text-warm-600">
                {description}
              </p>
            ) : null}
            <p className="mt-0.5 truncate text-[11px] text-warm-500">
              {listItem.sourceName ?? "Thẻ tín dụng"}
              {" · "}
              {String(paid)}/{String(total)} kỳ
              {" · "}
              <span className="font-mono tabular-nums">
                {listItem.status === "active"
                  ? formatCurrency(listItem.remainingAmount, currency)
                  : formatCurrency(listItem.totalAmount, currency)}
              </span>
            </p>
          </div>
        </div>
        <Badge
          size="sm"
          className={cn("shrink-0 capitalize", statusBadgeClasses(listItem.status))}
        >
          {statusLabel(listItem.status)}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-warm-100/80">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              listItem.status === "completed" ? "bg-success" : "bg-accent")}
            style={{ width: `${String(pct)}%` }}
          />
        </div>
        <span className="shrink-0 text-[11px] tabular-nums text-warm-500">
          {String(pct)}%
        </span>
        {listItem.canDelete && onDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 px-2 text-xs text-danger hover:bg-danger/10"
            aria-label="Xóa kế hoạch"
            leftIcon={<Trash2 className="size-3.5" aria-hidden />}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            Xóa
          </Button>
        ) : null}
      </div>
    </motion.article>
  );
}
