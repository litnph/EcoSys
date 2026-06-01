import { useQuery } from "@tanstack/react-query";

import { dashboardKeys } from "../api/dashboardKeys";
import { getMonthlyTrend } from "../api/dashboardApi";
import { DASHBOARD_CHART_QUERY_OPTIONS } from "../lib/dashboardQueryOptions";

export function useMonthlyTrend(months = 6) {
  return useQuery({
    queryKey: dashboardKeys.monthlyTrend(months),
    queryFn: () => getMonthlyTrend(months),
    ...DASHBOARD_CHART_QUERY_OPTIONS,
  });
}
