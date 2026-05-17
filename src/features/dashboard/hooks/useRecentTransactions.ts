"use client";

import { useQuery } from "@tanstack/react-query";

import { dashboardKeys } from "../api/dashboardKeys";
import { getRecentTransactions } from "../api/dashboardApi";

export function useRecentTransactions(
  smoduleId: string | undefined,
  limit = 5,
) {
  return useQuery({
    queryKey: smoduleId
      ? dashboardKeys.recentTransactions(smoduleId, limit)
      : ["dashboard", "recentTx", "__", limit],
    queryFn: () => getRecentTransactions(smoduleId ?? "", limit),
    enabled: Boolean(smoduleId),
    staleTime: 30_000,
  });
}
