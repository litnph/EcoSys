import { Receipt } from "lucide-react";
import {
  format,
  isToday,
  isYesterday,
  parseISO,
} from "date-fns";
import { vi } from "date-fns/locale";
import * as React from "react";

import type { FinCategoryFlat } from "@/features/categories/types";
import type { FinSource } from "@/features/sources/types";
import {
  EmptyState,
  type EmptyStateAction,
} from "@/shared/components/ui/EmptyState";
import { Button } from "@/shared/components/ui/Button";
import { SkeletonTable } from "@/shared/components/ui/Skeleton";
import { cn } from "@/shared/lib/utils";
import { formatCurrency } from "@/shared/lib/formatters";

import type { Transaction } from "../types";
import {
  isExpenseTxnType,
  isIncomeTxnType,
  isTransferTxnType,
} from "../utils/txnDisplay";
import {
  TXN_HEADER_CENTER,
  TXN_HEADER_GRID,
  TXN_TABLE_MIN_WIDTH,
} from "../utils/txnGridLayout";

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
  groupBy?: "none" | "day";
  categoryMap?: Map<string, FinCategoryFlat>;
  sourceMap?: Map<string, FinSource>;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  onOpen: (tx: Transaction) => void;
  onDelete?: (tx: Transaction) => void;
  emptyAction?: EmptyStateAction;
}

function ListHeader() {
  return (
    <div className={cn(TXN_HEADER_GRID, "bg-warm-50")}>
      <span className={TXN_HEADER_CENTER}>STT</span>
      <span className={TXN_HEADER_CENTER}>Ngày</span>
      <span className={TXN_HEADER_CENTER}>Số tiền</span>
      <span className={TXN_HEADER_CENTER}>Tag</span>
      <span className={TXN_HEADER_CENTER}>Danh mục cha</span>
      <span className={TXN_HEADER_CENTER}>Danh mục</span>
      <span className={TXN_HEADER_CENTER}>Nguồn tiền</span>
      <span className={TXN_HEADER_CENTER}>Trạng thái</span>
      <span>Mô tả</span>
      <span>Ghi chú</span>
    </div>
  );
}

export function TransactionList({
  items,
  isLoading,
  groupBy = "none",
  categoryMap,
  sourceMap,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  onOpen,
  onDelete,
  emptyAction,
}: TransactionListProps) {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = sentinelRef.current;
    const root = scrollRef.current;
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
      { root, rootMargin: "80px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, items.length]);

  const groups = React.useMemo(() => {
    const visible = items.filter((t) => t.type !== "reversal");
    const map = new Map<string, Transaction[]>();
    for (const t of visible) {
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

  const visibleItems = React.useMemo(
    () => items.filter((t) => t.type !== "reversal"),
    [items],
  );

  const rowNumberById = React.useMemo(() => {
    const map = new Map<string, number>();
    let rowNumber = 0;
    if (groupBy === "none") {
      for (const tx of visibleItems) {
        rowNumber += 1;
        map.set(tx.id, rowNumber);
      }
    } else {
      for (const g of groups) {
        for (const tx of g.rows) {
          rowNumber += 1;
          map.set(tx.id, rowNumber);
        }
      }
    }
    return map;
  }, [groupBy, groups, visibleItems]);

  const renderRow = (tx: Transaction) => (
    <TransactionItem
      key={tx.id}
      transaction={tx}
      rowNumber={rowNumberById.get(tx.id)}
      categoryMap={categoryMap}
      sourceMap={sourceMap}
      onOpen={onOpen}
      onDelete={onDelete}
    />
  );

  const paginationBlock = hasNextPage ? (
    <div className="flex flex-col items-center gap-3 border-t border-warm-100 py-3">
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
  ) : null;

  const listShellClass =
    "flex h-full min-h-0 flex-col overflow-hidden rounded-card border border-warm-200 bg-surface shadow-sm";

  if (isLoading) {
    return (
      <div className={listShellClass}>
        <SkeletonTable rows={6} cols={3} showHeaderRow className="p-4" />
      </div>
    );
  }

  if (visibleItems.length === 0) {
    return (
      <div className={listShellClass}>
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-card border border-warm-200/80 bg-surface shadow-sm ring-1 ring-warm-100/50">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-auto overscroll-contain"
      >
        <div className={TXN_TABLE_MIN_WIDTH}>
          <div className="sticky top-0 z-20 border-b border-warm-100 bg-warm-50 shadow-sm">
            <ListHeader />
          </div>
          {groupBy === "none" ? (
            <ul className="relative z-0 divide-y divide-warm-100">
              {visibleItems.map((tx) => (
                <li key={tx.id} className="scroll-mt-2">
                  {renderRow(tx)}
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-4 p-2">
              {groups.map((g) => (
                <section key={g.key}>
                  <header className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-1">
                    <h3 className="font-display text-xs font-semibold uppercase tracking-wide text-warm-600">
                      {g.label}
                    </h3>
                    <p className="font-mono text-[11px] text-warm-500">
                      {g.thu > 0 ? (
                        <span className="text-success">Thu {g.thuFmt}</span>
                      ) : null}
                      {g.thu > 0 && g.chi > 0 ? <span className="mx-1">·</span> : null}
                      {g.chi > 0 ? (
                        <span className="text-danger">Chi {g.chiFmt}</span>
                      ) : null}
                    </p>
                  </header>
                  <ul className="divide-y divide-warm-100 overflow-hidden rounded-md border border-warm-100">
                    {g.rows.map((tx) => (
                      <li key={tx.id}>{renderRow(tx)}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
          {paginationBlock}
        </div>
      </div>
    </div>
  );
}
