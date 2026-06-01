import { useQuery } from "@tanstack/react-query";

import { dashboardKeys } from "../api/dashboardKeys";
import { getUpcomingDues } from "../api/dashboardApi";
import { DASHBOARD_LIVE_QUERY_OPTIONS } from "../lib/dashboardQueryOptions";

export function useUpcomingDues() {
  return useQuery({
    queryKey: dashboardKeys.upcomingDues(),
    queryFn: () => getUpcomingDues(),
    ...DASHBOARD_LIVE_QUERY_OPTIONS,
  });
}
