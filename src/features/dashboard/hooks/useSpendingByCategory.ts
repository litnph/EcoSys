import { useQuery } from "@tanstack/react-query";

import { dashboardKeys } from "../api/dashboardKeys";
import { getSpendingByCategory } from "../api/dashboardApi";
import { DASHBOARD_CHART_QUERY_OPTIONS } from "../lib/dashboardQueryOptions";

export function useSpendingByCategory(year: number, month: number) {
  return useQuery({
    queryKey: dashboardKeys.spendingByCategory(year, month),
    queryFn: () => getSpendingByCategory(year, month),
    ...DASHBOARD_CHART_QUERY_OPTIONS,
  });
}
