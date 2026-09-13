import { Trash2 } from "lucide-react";
import * as React from "react";

import type { FinCategoryFlat } from "@/features/categories/types";
import type { FinSource } from "@/features/sources/types";
import { cn } from "@/shared/lib/utils";
import { formatCurrency, formatDate } from "@/shared/lib/formatters";

import type { Transaction } from "../types";
import { resolveCategoryColumns } from "../utils/categoryDisplay";
import {
  isExpenseTxnType,
  isIncomeTxnType,
  isTransferTxnType,
  txnAmountPresentation,
  txnStatusBadgeClasses,
  txnStatusLabel,
} from "../utils/txnDisplay";

import { ColoredFieldTag } from "./ColoredFieldTag";

export interface TransactionItemCardProps {
  transaction: Transaction;
  isHighlighted?: boolean;
  categoryMap?: Map<string, FinCategoryFlat>;
  sourceMap?: Map<string, FinSource>;
  onOpen: (tx: Transaction) => void;
  onDelete?: (tx: Transaction) => void;
}

function TransactionItemCardInner({
  transaction: tx,
  isHighlighted = false,
  categoryMap,
  sourceMap,
  onOpen,
  onDelete,
}: TransactionItemCardProps) {
  const description = tx.description?.trim() || "—";

  const categoryCols = React.useMemo(
    () => resolveCategoryColumns(tx.categoryId, categoryMap, tx.categoryName),
    [tx.categoryId, tx.categoryName, categoryMap],
  );

  const source = sourceMap?.get(tx.sourceId);
  const sourceColor = source?.color ?? "#2563eb";
  const sourceLabel = source?.name ?? tx.sourceName ?? "—";

  const amountPres = React.useMemo(
    () =>
      txnAmountPresentation(tx.type, tx.amount, {
        hasInstallmentPlan: tx.hasInstallmentPlan,
        isInstallmentPayment: tx.isInstallmentPayment,
      }),
    [tx.type, tx.amount, tx.hasInstallmentPlan, tx.isInstallmentPayment],
  );

  const amountText = React.useMemo(() => {
    const abs = formatCurrency(Math.abs(tx.amount), tx.currency);
    if (tx.type === "reversal") return abs;
    if (isTransferTxnType(tx.type) || tx.type === "balance_adjustment") {
      if (tx.amount < 0) return `−${abs}`;
      if (tx.amount > 0) return `+${abs}`;
      return abs;
    }
    if (isIncomeTxnType(tx.type)) return `+${abs}`;
    if (isExpenseTxnType(tx.type)) return `−${abs}`;
    return abs;
  }, [tx.type, tx.amount, tx.currency]);

  const handleOpen = React.useCallback(() => {
    onOpen(tx);
  }, [onOpen, tx]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onOpen(tx);
      }
    },
    [onOpen, tx],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      data-txn-id={tx.id}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative cursor-pointer rounded-lg border border-warm-100 bg-surface p-3 transition-colors",
        "hover:bg-warm-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
        isHighlighted &&
          "border-accent/40 bg-accent/10 ring-2 ring-accent animate-pulse [animation-iteration-count:2]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p
              className={cn(
                "font-mono text-base font-semibold tabular-nums",
                amountPres.className)}
            >
              {amountText}
            </p>
            <time
              dateTime={tx.txnDate}
              className="shrink-0 text-xs font-semibold tabular-nums text-warm-600"
            >
              {formatDate(tx.txnDate)}
            </time>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <ColoredFieldTag
              label={categoryCols.categoryLabel}
              color={categoryCols.categoryColor}
              className="max-w-[9rem] truncate"
            />
            <ColoredFieldTag
              label={sourceLabel}
              color={sourceColor}
              className="max-w-[8rem] truncate"
            />
            <span
              className={cn(
                "inline-flex max-w-full items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium leading-tight",
                txnStatusBadgeClasses(tx.status),
              )}
            >
              <span className="truncate">{txnStatusLabel(tx.status)}</span>
            </span>
          </div>

          <p className="mt-2 line-clamp-2 text-sm text-warm-800">{description}</p>
        </div>

        {onDelete ? (
          <button
            type="button"
            className={cn(
              "shrink-0 rounded p-1.5 text-warm-400",
              "hover:bg-warm-100 hover:text-danger",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2")}
            aria-label="Xóa giao dịch"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(tx);
            }}
          >
            <Trash2 className="size-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export const TransactionItemCard = React.memo(TransactionItemCardInner);
