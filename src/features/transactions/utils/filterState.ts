import type { Transaction, TransactionFilterState, TransactionFilters } from "../types";

export function defaultTransactionFilterState(): TransactionFilterState {
  return {
    sourceIds: [],
    types: [],
    categoryKind: "expense",
    categoryId: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    amountMin: undefined,
    amountMax: undefined,
  };
}

export function transactionFiltersFromState(
  smoduleId: string,
  state: TransactionFilterState,
  page: number,
  pageSize: number,
): TransactionFilters {
  return {
    smoduleId,
    sourceId: state.sourceIds.length === 1 ? state.sourceIds[0] : undefined,
    type: state.types.length === 1 ? state.types[0] : undefined,
    categoryId: state.categoryId,
    dateFrom: state.dateFrom,
    dateTo: state.dateTo,
    amountMin: state.amountMin,
    amountMax: state.amountMax,
    page,
    pageSize,
  };
}

/** Khi chọn nhiều nguồn / nhiều loại, backend không lọc OR — lọc phía client trên từng trang đã tải. */
export function passesClientTxnFilters(
  tx: Transaction,
  state: TransactionFilterState,
): boolean {
  if (state.types.length > 1 && !state.types.includes(tx.type)) {
    return false;
  }
  if (state.sourceIds.length > 1 && !state.sourceIds.includes(tx.sourceId)) {
    return false;
  }
  return true;
}

export function countActiveFilters(state: TransactionFilterState): number {
  let n = 0;
  if (state.sourceIds.length > 0) n += 1;
  if (state.types.length > 0) n += 1;
  if (state.categoryId) n += 1;
  if (state.dateFrom || state.dateTo) n += 1;
  if (typeof state.amountMin === "number" && state.amountMin > 0) n += 1;
  if (typeof state.amountMax === "number" && state.amountMax > 0) n += 1;
  return n;
}
