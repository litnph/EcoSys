import { Plus, X } from "lucide-react";

import type { Transaction } from "@/features/transactions/types";
import {
  txnAmountPresentation,
  txnStatusBadgeClasses,
  txnStatusLabel,
} from "@/features/transactions/utils/txnDisplay";
import { Button } from "@/shared/components/ui/Button";
import { formatCurrency, formatDate } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";

import type { BillingCycleItemInclusionSource } from "../types";
import { billingCycleInclusionLabel } from "../utils/billingCycleDisplay";

export interface BillingCycleTxnRowProps {
  transaction: Transaction;
  currency?: string;
  inclusionSource?: BillingCycleItemInclusionSource;
  onOpen?: (tx: Transaction) => void;
  onAdd?: (tx: Transaction) => void;
  onRemove?: (tx: Transaction) => void;
  isAdding?: boolean;
  isRemoving?: boolean;
}

export function BillingCycleTxnRow({
  transaction: tx,
  currency,
  inclusionSource,
  onOpen,
  onAdd,
  onRemove,
  isAdding,
  isRemoving,
}: BillingCycleTxnRowProps) {
  const cur = currency ?? tx.currency;
  const label =
    tx.description?.trim() ||
    tx.categoryName?.trim() ||
    "—";
  const amountPresentation = txnAmountPresentation(tx.type, tx.amount, {
    hasInstallmentPlan: tx.hasInstallmentPlan,
    isInstallmentPayment: tx.isInstallmentPayment,
  });
  const amountText = formatCurrency(Math.abs(tx.amount), cur);
  const clickable = Boolean(onOpen);

  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-warm-200 bg-surface px-3 py-2.5",
        clickable && "cursor-pointer transition hover:bg-warm-50",
      )}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? () => onOpen?.(tx) : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen?.(tx);
              }
            }
          : undefined
      }
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="min-w-0 truncate text-sm font-semibold text-warm-900">
            {label}
          </p>
          {inclusionSource ? (
            <span className="shrink-0 rounded-md bg-warm-100 px-1.5 py-0.5 text-[10px] font-medium text-warm-600">
              {billingCycleInclusionLabel(inclusionSource)}
            </span>
          ) : null}
          <span
            className={cn(
              "shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
              txnStatusBadgeClasses(tx.status),
            )}
          >
            {txnStatusLabel(tx.status)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-warm-500">
          <span className="tabular-nums">{formatDate(tx.txnDate)}</span>
          {tx.categoryName?.trim() ? (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">{tx.categoryName}</span>
            </>
          ) : null}
          {tx.sourceName ? (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">{tx.sourceName}</span>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <p
          className={cn(
            "font-mono text-sm font-semibold tabular-nums",
            amountPresentation.className,
          )}
        >
          {amountPresentation.sign}
          {amountText}
        </p>
        {onAdd ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<Plus className="size-3.5" aria-hidden />}
            isLoading={isAdding}
            onClick={(e) => {
              e.stopPropagation();
              onAdd(tx);
            }}
          >
            Thêm
          </Button>
        ) : null}
        {onRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-warm-500 hover:text-danger"
            aria-label="Loại khỏi kỳ sao kê"
            isLoading={isRemoving}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(tx);
            }}
          >
            <X className="size-4" aria-hidden />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
