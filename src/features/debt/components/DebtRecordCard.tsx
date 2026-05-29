import { CheckCircle2, ChevronDown, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import * as React from "react";

import type { DebtRecord, DebtRecordListItem } from "../types";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { SkeletonText } from "@/shared/components/ui/Skeleton";
import { formatCurrency, formatDate } from "@/shared/lib/formatters";
import { cardHoverMotion } from "@/shared/lib/animations";
import { cn } from "@/shared/lib/utils";

import { DebtTransactionHistory } from "./DebtTransactionHistory";

function initials(name: string | null): string {
  const t = name?.trim() ?? "";
  if (!t) return "?";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
}

export interface DebtRecordCardProps {
  item: DebtRecordListItem;
  detail: DebtRecord | undefined;
  isExpanded: boolean;
  isDetailLoading: boolean;
  onToggleExpand: (recordId: string) => void;
  onRecordPayment: (recordId: string) => void;
  onDelete?: (recordId: string) => void;
  isDeleting?: boolean;
}

function DebtRecordCardInner({
  item,
  detail,
  isExpanded,
  isDetailLoading,
  onToggleExpand,
  onRecordPayment,
  onDelete,
  isDeleting,
}: DebtRecordCardProps) {
  const currency = item.currency ?? "VND";
  const name = item.personName?.trim() || "Không tên";
  const contact = item.personContact?.trim() || null;
  const isBorrowed = item.direction === "borrowed";

  const original = item.originalAmount;
  const remaining = item.remainingAmount;

  const progress = React.useMemo(() => {
    const paidPortion =
      original > 0 ? Math.min(1, (original - remaining) / original) : 0;
    const pct = Math.round(paidPortion * 1000) / 10;
    return { pct };
  }, [original, remaining]);

  const amounts = React.useMemo(
    () => ({
      originalFmt: formatCurrency(original, currency),
      remainingFmt: formatCurrency(remaining, currency),
    }),
    [original, remaining, currency]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const overdueActive =
    item.status === "active" &&
    (item.daysUntilDue !== null && item.daysUntilDue !== undefined
      ? item.daysUntilDue < 0
      : Boolean(item.dueDate && item.dueDate < todayStr));

  const canDeleteMistake =
    item.status === "active" &&
    remaining === original &&
    typeof onDelete === "function";

  const handleToggle = React.useCallback(() => {
    onToggleExpand(item.id);
  }, [onToggleExpand, item.id]);

  const handlePay = React.useCallback(() => {
    onRecordPayment(item.id);
  }, [onRecordPayment, item.id]);

  const handleDelete = React.useCallback(() => {
    onDelete?.(item.id);
  }, [onDelete, item.id]);

  return (
    <motion.article
      {...cardHoverMotion}
      className={cn(
        "flex flex-col gap-4 rounded-card border border-warm-200 bg-surface p-4 shadow-sm transition",
        isExpanded ? "ring-1 ring-accent/20" : "hover:border-warm-300")}
    >
      <div className="flex flex-wrap items-start gap-3">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white",
            isBorrowed ? "bg-danger" : "bg-success")}
          aria-hidden
        >
          {initials(item.personName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-semibold text-warm-900">{name}</h3>
            <Badge variant={isBorrowed ? "danger" : "success"} size="sm">
              {isBorrowed ? "Tôi mượn" : "Tôi cho vay"}
            </Badge>
          </div>
          {contact ? (
            <p className="mt-0.5 text-sm text-warm-600">{contact}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-warm-500">
            Ban đầu
          </p>
          <p className="font-mono text-lg font-semibold text-warm-900">
            {amounts.originalFmt}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-warm-500">
            Còn lại
          </p>
          <p className="font-mono text-lg font-semibold text-warm-900">
            {amounts.remainingFmt}
          </p>
        </div>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs text-warm-600">
          <span>Hoàn trả / thu hồi</span>
          <span className="font-mono tabular-nums">{progress.pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-warm-100">
          <div
            className={cn(
              "h-2 rounded-full transition-all",
              isBorrowed ? "bg-danger/80" : "bg-success/80")}
            style={{ width: `${Math.min(100, progress.pct)}%` }}
          />
        </div>
      </div>

      {item.dueDate ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-warm-600">Hạn:</span>
          <span className={cn("font-medium", overdueActive && "text-danger")}>
            {formatDate(item.dueDate)}
          </span>
          {overdueActive ? (
            <Badge variant="danger" size="sm">
              Quá hạn
            </Badge>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-t border-warm-100 pt-3">
        {item.status === "active" ? (
          <>
            <Button
              type="button"
              size="sm"
              onClick={handlePay}
              disabled={remaining <= 0}
            >
              {isBorrowed ? "Ghi nhận trả" : "Ghi nhận thu"}
            </Button>

            {canDeleteMistake ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-danger hover:bg-danger/10"
                leftIcon={<Trash2 className="size-4" aria-hidden />}
                onClick={handleDelete}
                disabled={isDeleting}
              >
                Xóa nhầm
              </Button>
            ) : null}
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
            <CheckCircle2 className="size-5" aria-hidden />
            Hoàn tất
          </span>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto gap-1"
          onClick={handleToggle}
          aria-expanded={isExpanded}
        >
          Lịch sử
          <ChevronDown
            className={cn(
              "size-4 transition-transform",
              isExpanded ? "rotate-180" : "")}
            aria-hidden
          />
        </Button>
      </div>

      {isExpanded ? (
        <div className="rounded-lg border border-warm-200 bg-warm-25/60 p-3">
          {isDetailLoading ? (
            <div className="space-y-2" aria-busy="true" aria-label="Đang tải lịch sử">
              <SkeletonText className="h-14 w-full rounded-lg" />
              <SkeletonText className="h-14 w-full rounded-lg" />
            </div>
          ) : detail ? (
            <DebtTransactionHistory transactions={detail.transactions} currency={currency} />
          ) : (
            <p className="text-sm text-warm-500">Không có dữ liệu lịch sử.</p>
          )}
        </div>
      ) : null}
    </motion.article>
  );
}

export const DebtRecordCard = React.memo(DebtRecordCardInner);
