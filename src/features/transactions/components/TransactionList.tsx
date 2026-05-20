"use client";

import { Receipt } from "lucide-react";
import {
  format,
  isToday,
  isYesterday,
  parseISO,
} from "date-fns";
import { vi } from "date-fns/locale";
import * as React from "react";

import {
  EmptyState,
  type EmptyStateAction,
} from "@/shared/components/ui/EmptyState";
import { Button } from "@/shared/components/ui/Button";
import { SkeletonTable } from "@/shared/components/ui/Skeleton";
import { formatCurrency } from "@/shared/lib/formatters";
import { staggerChildren, staggerItem } from "@/shared/lib/animations";
import { cn } from "@/shared/lib/utils";
import { motion } from "framer-motion";

import type { Transaction } from "../types";
import {
  isExpenseTxnType,
  isIncomeTxnType,
  isTransferTxnType,
} from "../utils/txnDisplay";

import { TransactionItem } from "./TransactionItem";

function dateKey(iso: string): string {
  return iso.length >= 10 ? iso.slice(0, 10) : iso;
}

function groupLabel(key: string): string {
  const d = parseISO(`${key}T12:00:00`);
  if (isToday(d)) return "Hôm nay";
  if (isYesterday(d)) return "Hôm qua";
  return format(d, "dd/MM/yyyy", { locale: vi });
}

function dayTotals(rows: Transaction[]): { thu: number; chi: number } {
  let thu = 0;
  let chi = 0;
  for (const t of rows) {
    if (t.type === "reversal") continue;
    if (isTransferTxnType(t.type)) continue;
    if (isIncomeTxnType(t.type)) thu += Math.abs(t.amount);
    else if (isExpenseTxnType(t.type)) chi += Math.abs(t.amount);
  }
  return { thu, chi };
}

export interface TransactionListProps {
  items: Transaction[];
  isLoading: boolean;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  onOpen: (tx: Transaction) => void;
  onDelete?: (tx: Transaction) => void;
  emptyAction?: EmptyStateAction;
}

export function TransactionList({
  items,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  onOpen,
  onDelete,
  emptyAction,
}: TransactionListProps) {
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !fetchNextPage || !hasNextPage) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          hasNextPage &&
          !isFetchingNextPage
        ) {
          fetchNextPage();
        }
      },
      { rootMargin: "120px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, items.length]);

  const groups = React.useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of items) {
      const k = dateKey(t.txnDate);
      const cur = map.get(k) ?? [];
      cur.push(t);
      map.set(k, cur);
    }
    const keys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));
    return keys.map((k) => {
      const rows = map.get(k) ?? [];
      const { thu, chi } = dayTotals(rows);
      return {
        key: k,
        label: groupLabel(k),
        rows,
        thu,
        chi,
        thuFmt: thu > 0 ? formatCurrency(thu) : null,
        chiFmt: chi > 0 ? formatCurrency(chi) : null,
      };
    });
  }, [items]);

  if (isLoading) {
    return (
      <SkeletonTable rows={6} cols={3} showHeaderRow className="mt-4" />
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-6 rounded-card border border-warm-200 bg-surface shadow-sm">
        <EmptyState
          icon={<Receipt aria-hidden />}
          title="Chưa có giao dịch nào"
          description="Tạo giao dịch đầu tiên để bắt đầu theo dõi thu chi."
          action={emptyAction}
        />
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-6">
      {groups.map((g) => (
          <section key={g.key}>
            <header className="mb-2 flex flex-wrap items-baseline justify-between gap-2 px-1">
              <h3 className="font-display text-sm font-semibold text-warm-800">
                {g.label}
              </h3>
              <p className="text-xs text-warm-400">
                {g.thu > 0 ? (
                  <span className="text-success">Thu {g.thuFmt}</span>
                ) : null}
                {g.thu > 0 && g.chi > 0 ? <span className="mx-1">·</span> : null}
                {g.chi > 0 ? (
                  <span className="text-danger">Chi {g.chiFmt}</span>
                ) : null}
                {g.thu === 0 && g.chi === 0 ? (
                  <span>Không có thu/chi</span>
                ) : null}
              </p>
            </header>
            <motion.ul
              variants={staggerChildren}
              initial="initial"
              animate="animate"
              className={cn(
                "divide-y divide-warm-100 overflow-hidden rounded-card",
                "border border-warm-200 bg-surface shadow-sm")}
            >
              {g.rows.map((tx) => (
                <motion.li
                  key={tx.id}
                  variants={staggerItem}
                  className="scroll-mt-20"
                >
                  <TransactionItem
                    transaction={tx}
                    onOpen={onOpen}
                    onDelete={onDelete}
                  />
                </motion.li>
              ))}
            </motion.ul>
          </section>
        ))}

      {hasNextPage ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <div ref={sentinelRef} className="h-1 w-full" aria-hidden />
          {isFetchingNextPage ? (
            <p className="text-sm text-warm-500">Đang tải thêm…</p>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fetchNextPage?.()}
            >
              Tải thêm
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
