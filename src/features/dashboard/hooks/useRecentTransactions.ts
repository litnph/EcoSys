"use client";

import { useQuery } from "@tanstack/react-query";

import { dashboardKeys } from "../api/dashboardKeys";
import { getRecentTransactions } from "../api/dashboardApi";

export function useRecentTransactions(limit = 5) {
  return useQuery({
    queryKey: dashboardKeys.recentTransactions(limit),
    queryFn: () => getRecentTransactions(limit),
    staleTime: 30_000,
  });
}
