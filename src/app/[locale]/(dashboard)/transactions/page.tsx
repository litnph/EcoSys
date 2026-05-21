"use client";

import { Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import {
  DeleteTransactionModal,
  TransactionDetailDrawer,
  TransactionFormModal,
  TransactionFilters,
  TransactionList,
} from "@/features/transactions/components";
import {
  defaultTransactionFilterState,
} from "@/features/transactions/utils/filterState";
import { useDeleteTransaction, useTransactions } from "@/features/transactions/hooks";
import type { Transaction } from "@/features/transactions/types";
import { useSources } from "@/features/sources/hooks";

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
  const searchParams = useSearchParams();
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

  const txQuery = useTransactions(filterState,
    20);

  const items = useMemo(
    () => txQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [txQuery.data]);

  const [selected, setSelected] = useState<Transaction | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
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
    <div className="w-full max-w-[1400px] pb-8">
      <div className="flex flex-row items-end justify-between gap-4">
        <PageHeader
          title={t("pageTitle")}
          description={t("pageDescription")}
        />
        <Button
          type="button"
          className="shrink-0"
          leftIcon={<Plus className="size-4" aria-hidden />}
          onClick={() => setCreateOpen(true)}
        >
          {t("newTransaction")}
        </Button>
      </div>

      <>
          <ErrorBoundary fallbackTitle="Không tải được bộ lọc">
            <div className="mt-6">
              <TransactionFilters
                
                sources={sources}
                value={filterState}
                onChange={setFilterState}
              />
            </div>
          </ErrorBoundary>

          {txQuery.isError ? (
            <div className="mt-8 rounded-card border border-danger/30 bg-danger/5 p-6 text-sm text-danger">
              {t("loadListError")}
            </div>
          ) : (
            <ErrorBoundary fallbackTitle="Không tải được danh sách giao dịch">
              <TransactionList
                items={items}
                isLoading={txQuery.isLoading}
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

export default function TransactionsPage() {
  return (
    <Suspense fallback={<TransactionsPageFallback />}>
      <TransactionsPageInner />
    </Suspense>
  );
}
