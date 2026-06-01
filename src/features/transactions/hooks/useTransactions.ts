import { useInfiniteQuery } from "@tanstack/react-query";

import type { FinSource } from "@/features/sources/types";

import { getTransactions } from "../api/transactionsApi";
import { transactionKeys } from "../api/transactionKeys";
import type { TransactionFilterState } from "../types";
import {
  passesClientTxnFilters,
  transactionFiltersFromState,
} from "../utils/filterState";

function buildSourceMap(sources: FinSource[] | undefined): Map<string, FinSource> {
  const map = new Map<string, FinSource>();
  for (const s of sources ?? []) {
    map.set(s.id, s);
  }
  return map;
}

function stableInfiniteKey(
  state: TransactionFilterState,
  pageSize: number,
): unknown[] {
  return [
    ...transactionKeys.all,
    "infinite",
    pageSize,
    state.billingPeriod,
    state.sourceIds.slice().sort().join(","),
    state.types.slice().sort().join(","),
    state.parentCategoryId ?? "",
    state.categoryId ?? "",
    state.categoryKind,
    state.dateFrom ?? "",
    state.dateTo ?? "",
    state.amountMin ?? "",
    state.amountMax ?? "",
    state.status ?? "",
    state.groupBy,
    state.sortBy,
  ];
}

export function useTransactions(
  state: TransactionFilterState,
  sources: FinSource[] | undefined,
  pageSize = 20,
) {
  const sourceMap = buildSourceMap(sources);

  return useInfiniteQuery({
    queryKey: stableInfiniteKey(state, pageSize),
    queryFn: async ({ pageParam }) => {
      const page = typeof pageParam === "number" ? pageParam : 1;
      const filters = transactionFiltersFromState(
        state,
        page,
        pageSize,
        sources,
      );
      const raw = await getTransactions(filters);
      return {
        ...raw,
        items: raw.items.filter((t) =>
          passesClientTxnFilters(t, state, sourceMap)),
      };
    },
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page < last.totalPages ? last.page + 1 : undefined,
    enabled: true,
    staleTime: 20_000,
  });
}
