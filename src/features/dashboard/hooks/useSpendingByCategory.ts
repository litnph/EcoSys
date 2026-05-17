"use client";

import { useQuery } from "@tanstack/react-query";

import { dashboardKeys } from "../api/dashboardKeys";
import { getSpendingByCategory } from "../api/dashboardApi";

export function useSpendingByCategory(
  smoduleId: string | undefined,
  year: number,
  month: number,
) {
  return useQuery({
    queryKey: smoduleId
      ? dashboardKeys.spendingByCategory(smoduleId, year, month)
      : ["dashboard", "spend", "__", year, month],
    queryFn: () =>
      getSpendingByCategory(smoduleId ?? "", year, month),
    enabled: Boolean(smoduleId),
    staleTime: 300_000,
  });
}
