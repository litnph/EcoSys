"use client";

import { useQuery } from "@tanstack/react-query";

import { dashboardKeys } from "../api/dashboardKeys";
import { getMonthlyTrend } from "../api/dashboardApi";

export function useMonthlyTrend(
  smoduleId: string | undefined,
  months = 6,
) {
  return useQuery({
    queryKey: smoduleId
      ? dashboardKeys.monthlyTrend(smoduleId, months)
      : ["dashboard", "trend", "__", months],
    queryFn: () => getMonthlyTrend(smoduleId ?? "", months),
    enabled: Boolean(smoduleId),
    staleTime: 300_000,
  });
}
