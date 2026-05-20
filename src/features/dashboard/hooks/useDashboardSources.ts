"use client";

import { useQuery } from "@tanstack/react-query";

import { dashboardKeys } from "../api/dashboardKeys";
import { getSourcesSummary } from "../api/dashboardApi";

export function useDashboardSources() {
  return useQuery({
    queryKey: dashboardKeys.sources(),
    queryFn: () => getSourcesSummary(),
    staleTime: 60_000,
  });
}
