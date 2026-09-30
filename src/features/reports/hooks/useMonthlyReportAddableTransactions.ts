import { useQuery } from "@tanstack/react-query";

import { reportKeys } from "../api/reportKeys";
import { getMonthlyReportAddableTransactions } from "../api/reportsApi";

export function useMonthlyReportAddableTransactions(
  year: number,
  month: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: reportKeys.addable(year, month),
    queryFn: () => getMonthlyReportAddableTransactions(year, month),
    enabled: enabled && year >= 2000 && month >= 1 && month <= 12,
    staleTime: 10_000,
  });
}
