"use client";

import { useQuery } from "@tanstack/react-query";

import { getTransactionHistory } from "../api/transactionsApi";
import { transactionKeys } from "../api/transactionKeys";

export interface UseTransactionHistoryOptions {
  enabled?: boolean;
}

export function useTransactionHistory(
  transactionId: string | null | undefined,
  options?: UseTransactionHistoryOptions,
) {
  const enabled = options?.enabled !== false;

  return useQuery({
    queryKey:
      transactionId != null && transactionId.length > 0
        ? transactionKeys.history(transactionId)
        : [...transactionKeys.all, "history", "__"],
    queryFn: () => getTransactionHistory(transactionId!),
    enabled: Boolean(transactionId && enabled),
    staleTime: 30_000,
  });
}
