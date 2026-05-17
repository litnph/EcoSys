"use client";

import { useQuery } from "@tanstack/react-query";

import { reportKeys } from "../api/reportKeys";
import { getMonthlyReport } from "../api/reportsApi";

export function useMonthlyReport(
  smoduleId: string | undefined,
  year: number,
  month: number,
) {
  return useQuery({
    queryKey: smoduleId
      ? reportKeys.detail(smoduleId, year, month)
      : reportKeys.detail("__", year, month),
    queryFn: () =>
      smoduleId
        ? getMonthlyReport(smoduleId, year, month)
        : Promise.reject(new Error("Thiếu smodule")),
    enabled: Boolean(smoduleId && smoduleId.trim().length > 0 && year >= 1900 &&
      month >= 1 && month <= 12),
    staleTime: 20_000,
  });
}
