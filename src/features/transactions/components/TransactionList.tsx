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
import { SkeletonTable, SkeletonText } from "@/shared/components/ui/Skeleton";
import { useIsMdUp } from "@/shared/hooks/useMediaQuery";
import { formatCurrency } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";

import type { Transaction } from "../types";
import {
  isExpenseTxnType,
  isIncomeTxnType,
  isTransferTxnType,
} from "../utils/txnDisplay";
import {
  TXN_TABLE_CLASS,
  TXN_TABLE_COLS,
  TXN_TH,
  TXN_TH_LAST,
} from "../utils/txnGridLayout";

import { TransactionItem } from "./TransactionItem";
import { TransactionItemCard } from "./TransactionItemCard";

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
  highlightedTransactionId?: string | null;
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

function TxnTableColGroup() {
  return (
    <colgroup>
      {TXN_TABLE_COLS.map((width, index) => (
        <col key={index} className={width || undefined} />
      ))}
    </colgroup>
  );
}

function TxnTableHeader() {
  return (
    <thead className="sticky top-0 z-20 bg-warm-50 shadow-[0_1px_0_0_rgb(245,245,244)]">
      <tr>
        <th scope="col" className={TXN_TH}>
          STT
        </th>
        <th scope="col" className={TXN_TH}>
          Ngày
        </th>
        <th scope="col" className={TXN_TH}>
          Số tiền
        </th>
        <th scope="col" className={TXN_TH}>
          Tag
        </th>
        <th scope="col" className={TXN_TH}>
          Danh mục cha
        </th>
        <th scope="col" className={TXN_TH}>
          Danh mục
        </th>
        <th scope="col" className={TXN_TH}>
          Nguồn tiền
        </th>
        <th scope="col" className={TXN_TH}>
          Trạng thái
        </th>
        <th scope="col" className={TXN_TH_LAST}>
          Mô tả
        </th>
      </tr>
    </thead>
  );
}

export function TransactionList({
  items,
  isLoading,
  highlightedTransactionId,
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
  const isMdUp = useIsMdUp();
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

  const renderRow = (tx: Transaction, rowIndex: number) => (
    <TransactionItem
      key={tx.id}
      transaction={tx}
      rowNumber={rowNumberById.get(tx.id)}
      rowIndex={rowIndex}
      isHighlighted={tx.id === highlightedTransactionId}
      categoryMap={categoryMap}
      sourceMap={sourceMap}
      onOpen={onOpen}
      onDelete={onDelete}
    />
  );

  const renderCard = (tx: Transaction) => (
    <TransactionItemCard
      key={tx.id}
      transaction={tx}
      isHighlighted={tx.id === highlightedTransactionId}
      categoryMap={categoryMap}
      sourceMap={sourceMap}
      onOpen={onOpen}
      onDelete={onDelete}
    />
  );

  const tableScrollClass = "overflow-x-auto overscroll-x-contain";

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
        {isMdUp ? (
          <SkeletonTable rows={6} cols={3} showHeaderRow className="p-4" />
        ) : (
          <div className="space-y-3 p-3" aria-busy="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonText key={index} className="h-28 w-full rounded-lg" />
            ))}
          </div>
        )}
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

  if (!isMdUp) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-card border border-warm-200/80 bg-surface shadow-sm ring-1 ring-warm-100/50">
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-auto overscroll-contain"
        >
          {groupBy === "none" ? (
            <div className="space-y-2 p-2">
              {visibleItems.map((tx) => renderCard(tx))}
            </div>
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
                      {g.thu > 0 && g.chi > 0 ? (
                        <span className="mx-1">·</span>
                      ) : null}
                      {g.chi > 0 ? (
                        <span className="text-danger">Chi {g.chiFmt}</span>
                      ) : null}
                    </p>
                  </header>
                  <div className="space-y-2">
                    {g.rows.map((tx) => renderCard(tx))}
                  </div>
                </section>
              ))}
            </div>
          )}
          {paginationBlock}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-card border border-warm-200/80 bg-surface shadow-sm ring-1 ring-warm-100/50">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-auto overscroll-contain"
      >
        {groupBy === "none" ? (
          <div className={tableScrollClass}>
            <table className={TXN_TABLE_CLASS}>
              <TxnTableColGroup />
              <TxnTableHeader />
              <tbody>
                {visibleItems.map((tx, index) => renderRow(tx, index))}
              </tbody>
            </table>
          </div>
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
                    {g.thu > 0 && g.chi > 0 ? (
                      <span className="mx-1">·</span>
                    ) : null}
                    {g.chi > 0 ? (
                      <span className="text-danger">Chi {g.chiFmt}</span>
                    ) : null}
                  </p>
                </header>
                <div
                  className={cn(
                    tableScrollClass,
                    "rounded-md border border-warm-100")}
                >
                  <table className={TXN_TABLE_CLASS}>
                    <TxnTableColGroup />
                    <tbody>
                      {g.rows.map((tx, index) => renderRow(tx, index))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        )}
        {paginationBlock}
      </div>
    </div>
  );
}
