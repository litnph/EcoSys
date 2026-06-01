import { useQuery } from "@tanstack/react-query";

import { dashboardKeys } from "../api/dashboardKeys";
import { getSourcesSummary } from "../api/dashboardApi";
import { DASHBOARD_LIVE_QUERY_OPTIONS } from "../lib/dashboardQueryOptions";

export function useDashboardSources() {
  return useQuery({
    queryKey: dashboardKeys.sources(),
    queryFn: () => getSourcesSummary(),
    ...DASHBOARD_LIVE_QUERY_OPTIONS,
  });
}
