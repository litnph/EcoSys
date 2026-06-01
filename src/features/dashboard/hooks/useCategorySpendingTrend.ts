import { useQuery } from "@tanstack/react-query";

import { dashboardKeys } from "../api/dashboardKeys";
import { getCategorySpendingTrendBundle } from "../api/dashboardApi";
import { DASHBOARD_CHART_QUERY_OPTIONS } from "../lib/dashboardQueryOptions";

export function useCategorySpendingTrend(months = 6) {
  return useQuery({
    queryKey: dashboardKeys.categorySpendingTrend(months),
    queryFn: () => getCategorySpendingTrendBundle(months),
    ...DASHBOARD_CHART_QUERY_OPTIONS,
  });
}
