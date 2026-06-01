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
  txnStatusBadgeClasses,
  txnStatusLabel,
} from "../utils/txnDisplay";
import {
  TXN_ROW_HOVER,
  TXN_TD_CENTER,
  TXN_TD_LEFT,
  TXN_TD_LEFT_LAST,
  TXN_TD_RIGHT,
} from "../utils/txnGridLayout";

import { ColoredFieldTag } from "./ColoredFieldTag";

export interface TransactionItemProps {
  transaction: Transaction;
  rowNumber?: number;
  rowIndex?: number;
  isHighlighted?: boolean;
  categoryMap?: Map<string, FinCategoryFlat>;
  sourceMap?: Map<string, FinSource>;
  onOpen: (tx: Transaction) => void;
  onDelete?: (tx: Transaction) => void;
}

function TransactionTags({ tags }: { tags: Transaction["tags"] }) {
  if (!tags?.length) {
    return <span className="text-xs text-warm-400">—</span>;
  }

  return (
    <div className="flex max-w-full flex-wrap items-center justify-start gap-1">
      {tags.map((tag) => (
        <ColoredFieldTag
          key={tag.id}
          label={tag.name}
          color={tag.color}
          className="px-1.5 py-0.5 text-[10px]"
        />
      ))}
    </div>
  );
}

function TransactionItemInner({
  transaction: tx,
  rowNumber,
  rowIndex = 0,
  isHighlighted = false,
  categoryMap,
  sourceMap,
  onOpen,
  onDelete,
}: TransactionItemProps) {
  const description = tx.description?.trim() || "—";

  const categoryCols = React.useMemo(
    () => resolveCategoryColumns(tx.categoryId, categoryMap, tx.categoryName),
    [tx.categoryId, tx.categoryName, categoryMap],
  );

  const source = sourceMap?.get(tx.sourceId);
  const sourceColor = source?.color ?? "#2563eb";
  const sourceLabel = source?.name ?? tx.sourceName ?? "—";

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

  const handleOpenClick = React.useCallback(() => {
    onOpen(tx);
  }, [onOpen, tx]);

  const handleRowKeyDown = React.useCallback(
    (k: React.KeyboardEvent<HTMLTableRowElement>) => {
      if (k.key === "Enter" || k.key === " ") {
        k.preventDefault();
        onOpen(tx);
      }
    },
    [onOpen, tx],
  );

  return (
    <tr
      role="button"
      tabIndex={0}
      data-txn-id={tx.id}
      onClick={handleOpenClick}
      onKeyDown={handleRowKeyDown}
      className={cn(
        TXN_ROW_HOVER,
        "group border-b border-warm-100/80 last:border-b-0",
        rowIndex % 2 === 1 ? "bg-warm-50/80" : "bg-surface",
        isHighlighted &&
          "bg-accent/10 ring-2 ring-inset ring-accent animate-pulse [animation-iteration-count:2]",
      )}
    >
      <td className={cn(TXN_TD_CENTER, "text-xs font-medium tabular-nums text-warm-500")}>
        {rowNumber ?? "—"}
      </td>

      <td className={cn(TXN_TD_CENTER, "text-xs font-semibold tabular-nums text-warm-700")}>
        {formatDate(tx.txnDate)}
      </td>

      <td className={cn(TXN_TD_RIGHT, "font-mono text-sm font-semibold text-warm-900")}>
        {amountText}
      </td>

      <td className={TXN_TD_LEFT}>
        <TransactionTags tags={tx.tags} />
      </td>

      <td className={TXN_TD_LEFT}>
        <ColoredFieldTag
          label={categoryCols.parentLabel}
          color={categoryCols.parentColor}
        />
      </td>

      <td className={TXN_TD_LEFT}>
        <ColoredFieldTag
          label={categoryCols.categoryLabel}
          color={categoryCols.categoryColor}
        />
      </td>

      <td className={TXN_TD_LEFT}>
        <ColoredFieldTag label={sourceLabel} color={sourceColor} />
      </td>

      <td className={TXN_TD_LEFT}>
        <span
          className={cn(
            "inline-flex max-w-full items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium leading-tight",
            txnStatusBadgeClasses(tx.status),
          )}
        >
          <span className="truncate">{txnStatusLabel(tx.status)}</span>
        </span>
      </td>

      <td className={cn(TXN_TD_LEFT_LAST, "relative min-w-0")}>
        <span className="block truncate pr-6 text-sm font-medium text-warm-900">
          {description}
        </span>
        {onDelete ? (
          <button
            type="button"
            className="absolute right-2 top-1/2 z-[1] hidden -translate-y-1/2 rounded p-1 text-warm-400 hover:bg-warm-100 hover:text-danger group-hover:inline-flex"
            aria-label="Xóa giao dịch"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(tx);
            }}
          >
            <Trash2 className="size-3.5" />
          </button>
        ) : null}
      </td>
    </tr>
  );
}

export const TransactionItem = React.memo(TransactionItemInner);
