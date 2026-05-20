"use client";

import { useQuery } from "@tanstack/react-query";

import { dashboardKeys } from "../api/dashboardKeys";
import { getSpendingByCategory } from "../api/dashboardApi";

export function useSpendingByCategory(year: number, month: number) {
  return useQuery({
    queryKey: dashboardKeys.spendingByCategory(year, month),
    queryFn: () => getSpendingByCategory(year, month),
    staleTime: 300_000,
  });
}
