import { useQuery } from "@tanstack/react-query";

import { reportKeys } from "../api/reportKeys";
import { getMonthlyPeriods } from "../api/reportsApi";

export function useMonthlyPeriods() {
  return useQuery({
    queryKey: reportKeys.list(),
    queryFn: () => getMonthlyPeriods(),
    staleTime: 45_000,
  });
}
