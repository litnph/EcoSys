"use client";

import { useQuery } from "@tanstack/react-query";

import { dashboardKeys } from "../api/dashboardKeys";
import { getSummary } from "../api/dashboardApi";

export function useDashboardSummary(smoduleId: string | undefined) {
  return useQuery({
    queryKey: smoduleId
      ? dashboardKeys.summary(smoduleId)
      : ["dashboard", "summary", "__"],
    queryFn: () => getSummary(smoduleId ?? ""),
    enabled: Boolean(smoduleId),
    staleTime: 60_000,
  });
}
