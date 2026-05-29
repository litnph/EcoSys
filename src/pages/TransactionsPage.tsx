import { Layers, Plus } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useTranslations } from "@/i18n/hooks";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { useAllCategoriesMap } from "@/features/categories/hooks/useAllCategoriesMap";

import {
  DeleteTransactionModal,
  TransactionDetailDrawer,
  TransactionFormModal,
  BulkTransactionFormModal,
  TransactionFilters,
  TransactionList,
} from "@/features/transactions/components";
import {
  defaultTransactionFilterState,
  passesClientTxnFilters,
} from "@/features/transactions/utils/filterState";
import { passesParentCategoryFilter } from "@/features/transactions/utils/categoryDisplay";
import { sortTransactions } from "@/features/transactions/utils/txnSort";
import { useDeleteTransaction, useTransactions } from "@/features/transactions/hooks";
import type { Transaction } from "@/features/transactions/types";
import { useSources } from "@/features/sources/hooks";
import type { FinSource } from "@/features/sources/types";

import { PageHeader } from "@/shared/components/layouts/PageHeader";
import { ErrorBoundary } from "@/shared/components/feedback/ErrorBoundary";
import { SkeletonText } from "@/shared/components/ui/Skeleton";
import { Button } from "@/shared/components/ui/Button";
function calendarMonthIsoRange(year: number, month: number): {
  dateFrom: string;
  dateTo: string;
} | null {
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
  if (month < 1 || month > 12) return null;
  const m = String(month).padStart(2, "0");
  const dim = new Date(year, month, 0).getDate();
  return {
    dateFrom: `${year}-${m}-01`,
    dateTo: `${year}-${m}-${String(dim).padStart(2, "0")}`,
  };
}

function TransactionsPageInner() {
  const t = useTranslations("transaction");
  const [searchParams] = useSearchParams();
  const [filterState, setFilterState] = useState(defaultTransactionFilterState);
  const qsKey = searchParams.toString();

  useEffect(() => {
    const sp = new URLSearchParams(qsKey);
    const categoryIdRaw = sp.get("categoryId");
    const yearStr = sp.get("year");
    const monthStr = sp.get("month");
    const hasCat = typeof categoryIdRaw === "string" && categoryIdRaw.trim().length > 0;
    const hasYm =
      typeof yearStr === "string" &&
      yearStr.length > 0 &&
      typeof monthStr === "string" &&
      monthStr.length > 0;

    if (!hasCat && !hasYm) {
      setFilterState(defaultTransactionFilterState());
      return;
    }

    const next = defaultTransactionFilterState();
    next.categoryKind = "expense";

    if (hasCat) {
      next.categoryId = categoryIdRaw.trim();
    }

    if (hasYm) {
      const yr = Number(yearStr);
      const mo = Number(monthStr);
      const range = calendarMonthIsoRange(yr, mo);
      if (range) {
        next.dateFrom = range.dateFrom;
        next.dateTo = range.dateTo;
      }
    }

    setFilterState(next);
  }, [qsKey]);

  const { data: sources } = useSources();
  const categoryMap = useAllCategoriesMap();

  const sourceMap = useMemo(() => {
    const map = new Map<string, FinSource>();
    for (const s of sources ?? []) {
      map.set(s.id, s);
    }
    return map;
  }, [sources]);

  const txQuery = useTransactions(filterState, 20);

  const items = useMemo(() => {
    const flat = txQuery.data?.pages.flatMap((p) => p.items) ?? [];
    const filtered = flat.filter((tx) => {
      if (!passesClientTxnFilters(tx, filterState)) return false;
      if (
        filterState.parentCategoryId &&
        !passesParentCategoryFilter(
          tx,
          filterState.parentCategoryId,
          categoryMap,
        )
      ) {
        return false;
      }
      return true;
    });
    return sortTransactions(filtered, filterState.sortBy);
  }, [txQuery.data, filterState, categoryMap]);

  const [selected, setSelected] = useState<Transaction | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deleteModalTx, setDeleteModalTx] = useState<Transaction | null>(null);

  const openDetail = useCallback((tx: Transaction) => {
    setSelected(tx);
    setDrawerOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setDrawerOpen(false);
    setSelected(null);
  }, []);

  const requestDelete = useCallback((tx: Transaction) => {
    setDeleteModalTx(tx);
  }, []);

  const deleteMutation = useDeleteTransaction();

  return (
    <div className="flex h-[calc(100dvh-56px-2rem)] w-full max-w-[1400px] flex-col overflow-hidden">
      <div className="flex shrink-0 flex-row items-end justify-between gap-4">
        <PageHeader
          title={t("pageTitle")}
          description={t("pageDescription")}
        />
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            leftIcon={<Layers className="size-4" aria-hidden />}
            onClick={() => setBulkOpen(true)}
          >
            Nhập hàng loạt
          </Button>
          <Button
            type="button"
            className="shrink-0"
            leftIcon={<Plus className="size-4" aria-hidden />}
            onClick={() => setCreateOpen(true)}
          >
            {t("newTransaction")}
          </Button>
        </div>
      </div>

      <>
          <ErrorBoundary fallbackTitle="Không tải được bộ lọc">
            <div className="mt-4 shrink-0">
              <TransactionFilters
                sources={sources}
                value={filterState}
                onChange={setFilterState}
              />
            </div>
          </ErrorBoundary>

          {txQuery.isError ? (
            <div className="mt-4 shrink-0 rounded-card border border-danger/30 bg-danger/5 p-6 text-sm text-danger">
              {t("loadListError")}
            </div>
          ) : (
            <ErrorBoundary fallbackTitle="Không tải được danh sách giao dịch">
              <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
                <TransactionList
                  items={items}
                  isLoading={txQuery.isLoading}
                  groupBy={filterState.groupBy}
                  categoryMap={categoryMap}
                  sourceMap={sourceMap}
                  isFetchingNextPage={txQuery.isFetchingNextPage}
                  hasNextPage={txQuery.hasNextPage}
                  fetchNextPage={() => void txQuery.fetchNextPage()}
                  onOpen={openDetail}
                  onDelete={requestDelete}
                  emptyAction={{
                    label: t("newTransaction"),
                    onClick: () => setCreateOpen(true),
                  }}
                />
              </div>
            </ErrorBoundary>
          )}
      </>

      <TransactionDetailDrawer
        transactionId={selected?.id ?? null}
        listPreview={selected}
        isOpen={drawerOpen}
        onClose={closeDetail}
      />

      <TransactionFormModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      <BulkTransactionFormModal
        isOpen={bulkOpen}
        onClose={() => setBulkOpen(false)}
      />

      <DeleteTransactionModal
        transactionId={deleteModalTx?.id ?? null}
        isOpen={deleteModalTx !== null}
        mutation={deleteMutation}
        onClose={() => setDeleteModalTx(null)}
        onDeleted={() => setDeleteModalTx(null)}
      />

    </div>
  );
}

function TransactionsPageFallback() {
  return (
    <div className="w-full max-w-[1400px] animate-pulse space-y-6 pb-8">
      <SkeletonText className="h-12 w-full max-w-md" />
      <SkeletonText className="h-[120px] w-full rounded-card" />
      <SkeletonText className="h-[520px] w-full rounded-card" />
    </div>
  );
}

export function TransactionsPage() {
  return (
    <Suspense fallback={<TransactionsPageFallback />}>
      <TransactionsPageInner />
    </Suspense>
  );
}
