"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { getTransactions } from "../api/transactionsApi";
import { transactionKeys } from "../api/transactionKeys";
import type { TransactionFilterState } from "../types";
import {
  passesClientTxnFilters,
  transactionFiltersFromState,
} from "../utils/filterState";

function stableInfiniteKey(
  smoduleId: string,
  state: TransactionFilterState,
  pageSize: number,
): unknown[] {
  return [
    ...transactionKeys.all,
    "infinite",
    smoduleId,
    pageSize,
    state.sourceIds.slice().sort().join(","),
    state.types.slice().sort().join(","),
    state.categoryId ?? "",
    state.categoryKind,
    state.dateFrom ?? "",
    state.dateTo ?? "",
    state.amountMin ?? "",
    state.amountMax ?? "",
  ];
}

export function useTransactions(
  smoduleId: string | undefined,
  state: TransactionFilterState,
  pageSize = 20,
) {
  return useInfiniteQuery({
    queryKey: smoduleId
      ? stableInfiniteKey(smoduleId, state, pageSize)
      : [...transactionKeys.all, "infinite", "__"],
    queryFn: async ({ pageParam }) => {
      const page = typeof pageParam === "number" ? pageParam : 1;
      const filters = transactionFiltersFromState(
        smoduleId ?? "",
        state,
        page,
        pageSize,
      );
      const raw = await getTransactions(filters);
      return {
        ...raw,
        items: raw.items.filter((t) => passesClientTxnFilters(t, state)),
      };
    },
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page < last.totalPages ? last.page + 1 : undefined,
    enabled: Boolean(smoduleId && smoduleId.length > 0),
    staleTime: 20_000,
  });
}
