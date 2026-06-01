import { useQuery } from "@tanstack/react-query";

import { dashboardKeys } from "../api/dashboardKeys";
import { getSummary } from "../api/dashboardApi";
import { DASHBOARD_LIVE_QUERY_OPTIONS } from "../lib/dashboardQueryOptions";

export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: () => getSummary(),
    ...DASHBOARD_LIVE_QUERY_OPTIONS,
  });
}
