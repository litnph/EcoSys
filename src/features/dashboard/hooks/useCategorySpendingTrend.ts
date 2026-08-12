import { useQuery } from "@tanstack/react-query";

import { dashboardKeys } from "../api/dashboardKeys";
import { getCategorySpendingTrendBundle } from "../api/dashboardApi";
import { DASHBOARD_CHART_QUERY_OPTIONS } from "../lib/dashboardQueryOptions";

export function useCategorySpendingTrend(months = 6, currency = "VND") {
  return useQuery({
    queryKey: dashboardKeys.categorySpendingTrend(months, currency),
    queryFn: () => getCategorySpendingTrendBundle(months, currency),
    ...DASHBOARD_CHART_QUERY_OPTIONS,
  });
}
