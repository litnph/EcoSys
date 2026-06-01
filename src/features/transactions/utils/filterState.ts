import type { FinSource } from "@/features/sources/types";

import type { Transaction, TransactionFilterState, TransactionFilters } from "../types";
import {
  apiDateRangeForBillingPeriod,
  currentBillingPeriodKey,
  isDefaultBillingPeriod,
  passesBillingPeriodFilter,
} from "./periodFilter";

export const DEFAULT_TXN_STATUS = "new" as const;

/** @deprecated Dùng billingPeriod; giữ cho tương thích URL cũ. */
export function currentMonthRange(): { dateFrom: string; dateTo: string } {
  const key = currentBillingPeriodKey();
  const [yStr, mStr] = key.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const dim = new Date(y, m, 0).getDate();
  const mm = String(m).padStart(2, "0");
  return {
    dateFrom: `${String(y)}-${mm}-01`,
    dateTo: `${String(y)}-${mm}-${String(dim).padStart(2, "0")}`,
  };
}

export function defaultTransactionFilterState(): TransactionFilterState {
  return {
    billingPeriod: currentBillingPeriodKey(),
    sourceIds: [],
    types: [],
    categoryKind: "expense",
    parentCategoryId: undefined,
    categoryId: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    amountMin: undefined,
    amountMax: undefined,
    status: DEFAULT_TXN_STATUS,
    groupBy: "none",
    sortBy: "dateDesc",
  };
}

export function resolveApiDateRange(
  state: TransactionFilterState,
  sources: FinSource[] | undefined,
): { dateFrom?: string; dateTo?: string } {
  if (state.billingPeriod === "all") {
    return {};
  }
  if (state.billingPeriod === "custom") {
    return {
      dateFrom: state.dateFrom,
      dateTo: state.dateTo,
    };
  }
  return apiDateRangeForBillingPeriod(state.billingPeriod, sources);
}

export function transactionFiltersFromState(
  state: TransactionFilterState,
  page: number,
  pageSize: number,
  sources?: FinSource[],
): TransactionFilters {
  const dates = resolveApiDateRange(state, sources);
  return {
    sourceId: state.sourceIds.length === 1 ? state.sourceIds[0] : undefined,
    type: state.types.length === 1 ? state.types[0] : undefined,
    categoryId: state.categoryId,
    dateFrom: dates.dateFrom,
    dateTo: dates.dateTo,
    amountMin: state.amountMin,
    amountMax: state.amountMax,
    status: state.status,
    page,
    pageSize,
  };
}

/** Lọc client: nhiều nguồn/loại + kỳ sao kê thẻ. */
export function passesClientTxnFilters(
  tx: Transaction,
  state: TransactionFilterState,
  sourceMap: Map<string, FinSource>,
): boolean {
  if (state.types.length > 1 && !state.types.includes(tx.type)) {
    return false;
  }
  if (state.sourceIds.length > 1 && !state.sourceIds.includes(tx.sourceId)) {
    return false;
  }
  if (state.billingPeriod === "custom") {
    if (state.dateFrom && tx.txnDate < state.dateFrom) return false;
    if (state.dateTo && tx.txnDate > state.dateTo) return false;
    return true;
  }
  if (!passesBillingPeriodFilter(tx, state.billingPeriod, sourceMap)) {
    return false;
  }
  return true;
}

export function countActiveFilters(state: TransactionFilterState): number {
  let n = 0;
  if (state.sourceIds.length > 0) n += 1;
  if (state.types.length > 0) n += 1;
  if (state.parentCategoryId) n += 1;
  if (state.categoryId) n += 1;
  if (state.billingPeriod === "all" || state.billingPeriod === "custom") {
    n += 1;
  } else if (!isDefaultBillingPeriod(state.billingPeriod)) {
    n += 1;
  }
  if (typeof state.amountMin === "number" && state.amountMin > 0) n += 1;
  if (typeof state.amountMax === "number" && state.amountMax > 0) n += 1;
  if (state.status && state.status !== DEFAULT_TXN_STATUS) n += 1;
  if (state.groupBy !== "none") n += 1;
  if (state.sortBy !== "dateDesc") n += 1;
  return n;
}
