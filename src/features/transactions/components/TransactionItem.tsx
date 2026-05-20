"use client";

import { Trash2 } from "lucide-react";
import * as React from "react";

import { useMediaMd } from "@/shared/hooks/useMediaMd";
import { cn } from "@/shared/lib/utils";
import { formatCurrency, formatDate } from "@/shared/lib/formatters";

import type { Transaction } from "../types";
import {
  transactionTypeIcon,
  txnAmountPresentation,
} from "../utils/txnDisplay";

function categoryDotColor(id: string | null | undefined): string {
  if (!id) return "var(--color-warm-300)";
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * 13) % 360;
  return `hsl(${String(h)} 42% 42%)`;
}

export interface TransactionItemProps {
  transaction: Transaction;
  onOpen: (tx: Transaction) => void;
  onDelete?: (tx: Transaction) => void;
}

function TransactionItemInner({
  transaction: tx,
  onOpen,
  onDelete,
}: TransactionItemProps) {
  const mdUp = useMediaMd();
  const swipeEnabled = !mdUp && onDelete != null;

  const pointerId = React.useRef<number | null>(null);
  const startX = React.useRef(0);
  const [offset, setOffset] = React.useState(0);
  const openDelete = offset <= -56;

  const Icon = React.useMemo(
    () => transactionTypeIcon(tx.type),
    [tx.type]);

  const { label, sub } = React.useMemo(() => {
    const rawLabel =
      typeof tx.categoryName === "string" && tx.categoryName.length > 0
        ? tx.categoryName
        : (tx.note?.trim() || tx.description?.trim() || "Giao dịch");
    const noteOrDesc = tx.note?.trim() || tx.description?.trim() || "";
    const subLine =
      noteOrDesc.length > 0 && rawLabel !== noteOrDesc ? noteOrDesc : null;
    return { label: rawLabel, sub: subLine };
  }, [tx.categoryName, tx.note, tx.description]);

  const amountPresentation = React.useMemo(() => {
    const { sign, className: amountClass } = txnAmountPresentation(
      tx.type,
      tx.amount);
    const shownAmount = Math.abs(tx.amount);
    return {
      sign,
      amountClass,
      shownAmount,
      amountText: formatCurrency(shownAmount, tx.currency),
    };
  }, [tx.type, tx.amount, tx.currency]);

  const categoryColor = React.useMemo(
    () => categoryDotColor(tx.categoryId ?? null),
    [tx.categoryId]);

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      if (!swipeEnabled) return;
      pointerId.current = e.pointerId;
      startX.current = e.clientX;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [swipeEnabled]);

  const onPointerMove = React.useCallback(
    (e: React.PointerEvent) => {
      if (!swipeEnabled || pointerId.current !== e.pointerId) return;
      const dx = e.clientX - startX.current;
      const next = Math.min(0, Math.max(-88, dx));
      setOffset(next);
    },
    [swipeEnabled]);

  const endSwipe = React.useCallback(
    (e: React.PointerEvent) => {
      if (!swipeEnabled || pointerId.current !== e.pointerId) return;
      pointerId.current = null;
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        /* noop */
      }
      setOffset((o) => (o < -40 ? -72 : 0));
    },
    [swipeEnabled]);

  const handleDeleteSwipe = React.useCallback(() => {
    setOffset(0);
    onDelete?.(tx);
  }, [onDelete, tx]);

  const handleOpenClick = React.useCallback(() => {
    if (swipeEnabled && openDelete) {
      setOffset(0);
      return;
    }
    onOpen(tx);
  }, [swipeEnabled, openDelete, onOpen, tx]);

  const handleRowKeyDown = React.useCallback(
    (k: React.KeyboardEvent) => {
      if (k.key === "Enter" || k.key === " ") {
        k.preventDefault();
        onOpen(tx);
      }
    },
    [onOpen, tx]);

  return (
    <div className="relative overflow-hidden rounded-lg border border-transparent">
      {swipeEnabled ? (
        <div
          className="absolute inset-y-0 right-0 flex w-20 items-stretch justify-end bg-danger/10"
          aria-hidden
        >
          <button
            type="button"
            onClick={handleDeleteSwipe}
            className="flex w-16 items-center justify-center bg-danger text-white"
            aria-label="Xoá giao dịch"
          >
            <Trash2 className="size-5" />
          </button>
        </div>
      ) : null}

      <div
        role="button"
        tabIndex={0}
        onClick={handleOpenClick}
        onKeyDown={handleRowKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endSwipe}
        onPointerCancel={endSwipe}
        style={{
          transform: swipeEnabled ? `translateX(${String(offset)}px)` : undefined,
        }}
        className={cn(
          "relative flex w-full cursor-pointer items-center gap-3 bg-surface px-3 py-3 text-left transition-[transform]",
          "hover:bg-warm-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent")}
      >
        <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-warm-50 ring-1 ring-warm-200">
          <span
            className="absolute left-0.5 top-0.5 size-2 rounded-full ring-1 ring-white/80"
            style={{ backgroundColor: categoryColor }}
            aria-hidden
          />
          <Icon className="size-4 text-warm-700" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-warm-900">{label}</p>
          {sub ? (
            <p className="truncate text-xs text-warm-500">{sub}</p>
          ) : null}
          <p className="text-xs text-warm-400">{formatDate(tx.txnDate)}</p>
        </div>

        <p
          className={cn(
            "shrink-0 text-right font-mono text-sm font-semibold tabular-nums",
            amountPresentation.amountClass)}
        >
          {amountPresentation.sign}
          {amountPresentation.amountText}
        </p>
      </div>
    </div>
  );
}

export const TransactionItem = React.memo(TransactionItemInner);
