import { useQuery } from "@tanstack/react-query";

import { dashboardKeys } from "../api/dashboardKeys";
import { getMonthlyTrend } from "../api/dashboardApi";

export function useMonthlyTrend(months = 6) {
  return useQuery({
    queryKey: dashboardKeys.monthlyTrend(months),
    queryFn: () => getMonthlyTrend(months),
    staleTime: 300_000,
  });
}
