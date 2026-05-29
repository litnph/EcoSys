import type { Transaction, TransactionFilterState, TransactionFilters, TxnStatus } from "../types";

export const DEFAULT_TXN_STATUS: TxnStatus = "new";

export function currentMonthRange(): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const dim = new Date(y, m + 1, 0).getDate();
  const mm = String(m + 1).padStart(2, "0");
  return {
    dateFrom: `${y}-${mm}-01`,
    dateTo: `${y}-${mm}-${String(dim).padStart(2, "0")}`,
  };
}

export function isDefaultMonthRange(
  dateFrom?: string,
  dateTo?: string,
): boolean {
  const month = currentMonthRange();
  return dateFrom === month.dateFrom && dateTo === month.dateTo;
}

export function defaultTransactionFilterState(): TransactionFilterState {
  const month = currentMonthRange();
  return {
    sourceIds: [],
    types: [],
    categoryKind: "expense",
    parentCategoryId: undefined,
    categoryId: undefined,
    dateFrom: month.dateFrom,
    dateTo: month.dateTo,
    amountMin: undefined,
    amountMax: undefined,
    status: DEFAULT_TXN_STATUS,
    groupBy: "none",
    sortBy: "dateDesc",
  };
}

export function transactionFiltersFromState(
  state: TransactionFilterState,
  page: number,
  pageSize: number): TransactionFilters {
  return {
    sourceId: state.sourceIds.length === 1 ? state.sourceIds[0] : undefined,
    type: state.types.length === 1 ? state.types[0] : undefined,
    categoryId: state.categoryId,
    dateFrom: state.dateFrom,
    dateTo: state.dateTo,
    amountMin: state.amountMin,
    amountMax: state.amountMax,
    status: state.status,
    page,
    pageSize,
  };
}

/** Khi chọn nhiều nguồn / nhiều loại, backend không lọc OR — lọc phía client trên từng trang đã tải. */
export function passesClientTxnFilters(
  tx: Transaction,
  state: TransactionFilterState): boolean {
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
  if (state.parentCategoryId) n += 1;
  if (state.categoryId) n += 1;
  if ((state.dateFrom || state.dateTo) && !isDefaultMonthRange(state.dateFrom, state.dateTo)) {
    n += 1;
  }
  if (typeof state.amountMin === "number" && state.amountMin > 0) n += 1;
  if (typeof state.amountMax === "number" && state.amountMax > 0) n += 1;
  if (state.status && state.status !== DEFAULT_TXN_STATUS) n += 1;
  if (state.groupBy !== "none") n += 1;
  if (state.sortBy !== "dateDesc") n += 1;
  return n;
}
