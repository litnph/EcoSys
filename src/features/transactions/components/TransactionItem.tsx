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
import { TXN_BODY_ROW_GRID, TXN_CELL_CENTER } from "../utils/txnGridLayout";

import { ColoredFieldTag } from "./ColoredFieldTag";

export interface TransactionItemProps {
  transaction: Transaction;
  rowNumber?: number;
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
    <div className="flex max-w-full flex-wrap items-center justify-center gap-1">
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
  categoryMap,
  sourceMap,
  onOpen,
  onDelete,
}: TransactionItemProps) {
  const description = tx.description?.trim() || "—";
  const note = tx.note?.trim() || "—";

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
    (k: React.KeyboardEvent) => {
      if (k.key === "Enter" || k.key === " ") {
        k.preventDefault();
        onOpen(tx);
      }
    },
    [onOpen, tx],
  );

  return (
    <div className="group relative z-0">
      {onDelete ? (
        <button
          type="button"
          className="absolute right-1 top-1 z-[1] hidden rounded p-1 text-warm-400 hover:bg-warm-100 hover:text-danger group-hover:inline-flex"
          aria-label="Xóa giao dịch"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(tx);
          }}
        >
          <Trash2 className="size-3.5" />
        </button>
      ) : null}

      <div
        role="button"
        tabIndex={0}
        onClick={handleOpenClick}
        onKeyDown={handleRowKeyDown}
        className={cn(
          TXN_BODY_ROW_GRID,
          "cursor-pointer bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
        )}
      >
        <p
          className={cn(
            TXN_CELL_CENTER,
            "text-xs font-medium tabular-nums text-warm-500",
          )}
        >
          {rowNumber ?? "—"}
        </p>

        <div className={cn(TXN_CELL_CENTER, "text-xs font-semibold tabular-nums text-warm-700")}>
          {formatDate(tx.txnDate)}
        </div>

        <p className={cn(TXN_CELL_CENTER, "font-mono text-sm font-semibold tabular-nums text-warm-900")}>
          {amountText}
        </p>

        <div className={TXN_CELL_CENTER}>
          <TransactionTags tags={tx.tags} />
        </div>

        <div className={TXN_CELL_CENTER}>
          <ColoredFieldTag
            label={categoryCols.parentLabel}
            color={categoryCols.parentColor}
          />
        </div>

        <div className={TXN_CELL_CENTER}>
          <ColoredFieldTag
            label={categoryCols.categoryLabel}
            color={categoryCols.categoryColor}
          />
        </div>

        <div className={TXN_CELL_CENTER}>
          <ColoredFieldTag label={sourceLabel} color={sourceColor} />
        </div>

        <div className={TXN_CELL_CENTER}>
          <span
            className={cn(
              "inline-flex max-w-full items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium leading-tight",
              txnStatusBadgeClasses(tx.status),
            )}
          >
            <span className="truncate">{txnStatusLabel(tx.status)}</span>
          </span>
        </div>

        <p className="min-w-0 truncate pr-1 text-sm font-medium text-warm-900">
          {description}
        </p>

        <div className="min-w-0">
          {note !== "—" ? (
            <ColoredFieldTag label={note} color="#78716c" />
          ) : (
            <span className="text-xs text-warm-400">—</span>
          )}
        </div>
      </div>
    </div>
  );
}

export const TransactionItem = React.memo(TransactionItemInner);
