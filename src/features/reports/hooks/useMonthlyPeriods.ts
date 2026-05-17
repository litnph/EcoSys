"use client";

import { useQuery } from "@tanstack/react-query";

import { reportKeys } from "../api/reportKeys";
import { getMonthlyPeriods } from "../api/reportsApi";

export function useMonthlyPeriods(smoduleId: string | undefined) {
  return useQuery({
    queryKey: smoduleId
      ? reportKeys.list(smoduleId)
      : reportKeys.list("__"),
    queryFn: () =>
      smoduleId
        ? getMonthlyPeriods(smoduleId)
        : Promise.reject(new Error("Thiếu smodule")),
    enabled: Boolean(smoduleId && smoduleId.trim().length > 0),
    staleTime: 45_000,
  });
}
