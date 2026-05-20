"use client";

import { Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import {
  DeleteTransactionModal,
  ResponsiveTransactionFormShell,
  TransactionDetailDrawer,
  TransactionFilters,
  TransactionList,
} from "@/features/transactions/components";
import {
  defaultTransactionFilterState,
} from "@/features/transactions/utils/filterState";
import { useTransactions, useDeleteTransaction } from "@/features/transactions/hooks";
import type { Transaction } from "@/features/transactions/types";
import { useSources } from "@/features/sources/hooks";

import { useFinanceSmoduleId } from "@/shared/hooks/useFinanceSmoduleId";
import { MissingFinanceModule } from "@/shared/components/finance/MissingFinanceModule";
import { PageHeader } from "@/shared/components/layouts/PageHeader";
import { ErrorBoundary } from "@/shared/components/feedback/ErrorBoundary";
import { SkeletonText } from "@/shared/components/ui/Skeleton";
import { Button } from "@/shared/components/ui/Button";
import { cn } from "@/shared/lib/utils";

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
  const smoduleId = useFinanceSmoduleId();
  const missingModule = smoduleId.length === 0;

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

  const { data: sources } = useSources(
    smoduleId.length ? smoduleId : undefined,
  );

  const txQuery = useTransactions(
    smoduleId.length ? smoduleId : undefined,
    filterState,
    20,
  );

  const items = useMemo(
    () => txQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [txQuery.data],
  );

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

  const del = useDeleteTransaction();

  return (
    <div className="w-full max-w-[1400px] pb-24 md:pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title={t("pageTitle")}
          description={t("pageDescription")}
        />
        <Button
          type="button"
          className="hidden shrink-0 sm:inline-flex"
          leftIcon={<Plus className="size-4" aria-hidden />}
          onClick={() => setCreateOpen(true)}
          disabled={missingModule}
        >
          {t("newTransaction")}
        </Button>
      </div>

      {missingModule ? (
        <MissingFinanceModule />
      ) : (
        <>
          <ErrorBoundary fallbackTitle="Không tải được bộ lọc">
            <div className="mt-6">
              <TransactionFilters
                smoduleId={smoduleId}
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
      )}

      <TransactionDetailDrawer
        transactionId={selected?.id ?? null}
        listPreview={selected}
        isOpen={drawerOpen}
        onClose={closeDetail}
      />

      {!missingModule ? (
        <DeleteTransactionModal
          isOpen={deleteModalTx !== null}
          onClose={() => setDeleteModalTx(null)}
          transactionId={deleteModalTx?.id ?? null}
          smoduleId={deleteModalTx?.smoduleId ?? smoduleId}
          mutation={del}
          onDeleted={() => {
            if (
              deleteModalTx &&
              selected &&
              selected.id === deleteModalTx.id
            ) {
              closeDetail();
            }
            setDeleteModalTx(null);
          }}
        />
      ) : null}

      {!missingModule ? (
        <ResponsiveTransactionFormShell
          smoduleId={smoduleId}
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
        />
      ) : null}

      <button
        type="button"
        onClick={() => setCreateOpen(true)}
        disabled={missingModule}
        className={cn(
          "fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full",
          "bg-accent text-white shadow-lg transition hover:bg-accent-dark",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
          "md:hidden",
        )}
        aria-label={t("addTransactionAria")}
      >
        <Plus className="size-7" aria-hidden />
      </button>
    </div>
  );
}

function TransactionsPageFallback() {
  return (
    <div className="w-full max-w-[1400px] animate-pulse space-y-6 pb-24 md:pb-8">
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
