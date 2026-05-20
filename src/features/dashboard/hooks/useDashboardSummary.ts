"use client";

import { useQuery } from "@tanstack/react-query";

import { dashboardKeys } from "../api/dashboardKeys";
import { getSummary } from "../api/dashboardApi";

export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: () => getSummary(),
    staleTime: 60_000,
  });
}
