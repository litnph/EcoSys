"use client";

import { useQuery } from "@tanstack/react-query";

import { dashboardKeys } from "../api/dashboardKeys";
import { getSourcesSummary } from "../api/dashboardApi";

export function useDashboardSources(smoduleId: string | undefined) {
  return useQuery({
    queryKey: smoduleId
      ? dashboardKeys.sources(smoduleId)
      : ["dashboard", "sources", "__"],
    queryFn: () => getSourcesSummary(smoduleId ?? ""),
    enabled: Boolean(smoduleId),
    staleTime: 60_000,
  });
}
