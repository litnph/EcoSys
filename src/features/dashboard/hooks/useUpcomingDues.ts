"use client";

import { useQuery } from "@tanstack/react-query";

import { dashboardKeys } from "../api/dashboardKeys";
import { getUpcomingDues } from "../api/dashboardApi";

export function useUpcomingDues() {
  return useQuery({
    queryKey: dashboardKeys.upcomingDues(),
    queryFn: () => getUpcomingDues(),
    staleTime: 300_000,
  });
}
