import { useQuery } from "@tanstack/react-query";

import { dashboardKeys } from "../api/dashboardKeys";
import { getDashboardMetrics } from "../api/dashboardApi";
import { DASHBOARD_LIVE_QUERY_OPTIONS } from "../lib/dashboardQueryOptions";

export function useDashboardMetrics() {
  return useQuery({
    queryKey: dashboardKeys.metrics(),
    queryFn: () => getDashboardMetrics(),
    ...DASHBOARD_LIVE_QUERY_OPTIONS,
  });
}
