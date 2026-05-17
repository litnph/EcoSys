"use client";

import { useQuery } from "@tanstack/react-query";

import { dashboardKeys } from "../api/dashboardKeys";
import { getUpcomingDues } from "../api/dashboardApi";

export function useUpcomingDues(smoduleId: string | undefined) {
  return useQuery({
    queryKey: smoduleId
      ? dashboardKeys.upcomingDues(smoduleId)
      : ["dashboard", "dues", "__"],
    queryFn: () => getUpcomingDues(smoduleId ?? ""),
    enabled: Boolean(smoduleId),
    staleTime: 300_000,
  });
}
