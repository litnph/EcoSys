import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useSearchParams } from "react-router-dom";

import { getTransactionById } from "../api/transactionsApi";
import { transactionKeys } from "../api/transactionKeys";
import type { Transaction, TransactionDetail, TransactionFilterState } from "../types";
import { defaultTransactionFilterState } from "../utils/filterState";

function detailToTransaction(detail: TransactionDetail): Transaction {
  return {
    id: detail.id,
    type: detail.type,
    status: detail.status,
    amount: detail.amount,
    currency: detail.currency,
    sourceId: detail.sourceId,
    sourceName: detail.sourceName,
    categoryId: detail.categoryId,
    categoryName: detail.categoryName,
    txnDate: detail.txnDate,
    note: detail.note,
    description: detail.description,
    refTxnId: detail.refTxnId,
    createdAt: detail.createdAt,
    hasInstallmentPlan: detail.hasInstallmentPlan,
    isInstallmentPayment: detail.isInstallmentPayment,
    tags: detail.tags,
  };
}

function filterStateForTransaction(detail: TransactionDetail): TransactionFilterState {
  const monthKey = detail.txnDate.slice(0, 7);
  return {
    ...defaultTransactionFilterState(),
    billingPeriod: monthKey,
    status: undefined,
    sourceIds: [],
    types: [],
    categoryId: undefined,
    parentCategoryId: undefined,
  };
}

export interface UseTransactionHighlightOptions {
  items: Transaction[];
  isLoading: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  setFilterState: Dispatch<SetStateAction<TransactionFilterState>>;
  onHighlightReady?: (tx: Transaction) => void;
}

export function useTransactionHighlight({
  items,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  setFilterState,
  onHighlightReady,
}: UseTransactionHighlightOptions) {
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight")?.trim() || null;
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const resolvedRef = useRef<string | null>(null);
  const appliedFilterForRef = useRef<string | null>(null);

  const detailQ = useQuery({
    queryKey: [...transactionKeys.all, "highlight", highlightId],
    queryFn: () => getTransactionById(highlightId!),
    enabled: Boolean(highlightId),
    staleTime: 60_000,
    retry: false,
  });

  useEffect(() => {
    if (!highlightId) return;
    resolvedRef.current = null;
    appliedFilterForRef.current = null;
    setActiveHighlightId(highlightId);
  }, [highlightId]);

  useEffect(() => {
    if (!detailQ.data || !highlightId) return;
    if (appliedFilterForRef.current === highlightId) return;
    appliedFilterForRef.current = highlightId;
    setFilterState(filterStateForTransaction(detailQ.data));
  }, [detailQ.data, highlightId, setFilterState]);

  const mergedItems = useMemo(() => {
    if (!detailQ.data) return items;
    const mapped = detailToTransaction(detailQ.data);
    if (items.some((t) => t.id === mapped.id)) return items;
    return [mapped, ...items];
  }, [detailQ.data, items]);

  const highlightVisible = Boolean(
    highlightId && mergedItems.some((t) => t.id === highlightId),
  );

  useEffect(() => {
    if (!highlightId || isLoading || detailQ.isLoading) return;
    if (highlightVisible) return;
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage?.();
    }
  }, [
    detailQ.isLoading,
    fetchNextPage,
    hasNextPage,
    highlightId,
    highlightVisible,
    isFetchingNextPage,
    isLoading,
  ]);

  useEffect(() => {
    if (!highlightId || !highlightVisible) return;
    if (resolvedRef.current === highlightId) return;

    const tx = mergedItems.find((t) => t.id === highlightId);
    if (!tx) return;

    resolvedRef.current = highlightId;
    onHighlightReady?.(tx);

    const timer = window.setTimeout(() => {
      const row = document.querySelector(
        `[data-txn-id="${highlightId}"]`,
      );
      row?.scrollIntoView({ block: "center", behavior: "smooth" });

      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("highlight");
          return next;
        },
        { replace: true },
      );
    }, 120);

    return () => window.clearTimeout(timer);
  }, [
    highlightId,
    highlightVisible,
    mergedItems,
    onHighlightReady,
    setSearchParams,
  ]);

  return {
    highlightId: activeHighlightId,
    highlightError: detailQ.isError,
    mergedItems,
  };
}
