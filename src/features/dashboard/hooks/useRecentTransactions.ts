import { useQuery } from "@tanstack/react-query";

import { dashboardKeys } from "../api/dashboardKeys";
import { getRecentTransactions } from "../api/dashboardApi";
import { DASHBOARD_LIVE_QUERY_OPTIONS } from "../lib/dashboardQueryOptions";

export function useRecentTransactions(limit = 5) {
  return useQuery({
    queryKey: dashboardKeys.recentTransactions(limit),
    queryFn: () => getRecentTransactions(limit),
    ...DASHBOARD_LIVE_QUERY_OPTIONS,
  });
}
