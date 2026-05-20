"use client";

import { useQuery } from "@tanstack/react-query";

import { reportKeys } from "../api/reportKeys";
import { getMonthlyReport } from "../api/reportsApi";

export function useMonthlyReport(year: number, month: number) {
  return useQuery({
    queryKey: reportKeys.detail(year, month),
    queryFn: () => getMonthlyReport(year, month),
    enabled: year >= 1900 && month >= 1 && month <= 12,
    staleTime: 20_000,
  });
}
