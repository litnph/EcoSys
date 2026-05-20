import type { TransactionFilters } from "../types";

function stableFiltersKey(f: TransactionFilters): string {
  return JSON.stringify({    sourceId: f.sourceId ?? null,
    type: f.type ?? null,
    categoryId: f.categoryId ?? null,
    dateFrom: f.dateFrom ?? null,
    dateTo: f.dateTo ?? null,
    amountMin: f.amountMin ?? null,
    amountMax: f.amountMax ?? null,
    page: f.page,
    pageSize: f.pageSize,
  });
}

export const transactionKeys = {
  all: ["transactions"] as const,
  lists: () => [...transactionKeys.all, "list"] as const,
  list: (filters: TransactionFilters) =>
    [...transactionKeys.lists(), stableFiltersKey(filters)] as const,
  detail: (id: string) => [...transactionKeys.all, "detail", id] as const,
  history: (id: string) => [...transactionKeys.all, "history", id] as const,
  attachments: (id: string) =>
    [...transactionKeys.all, "attachments", id] as const,
};
