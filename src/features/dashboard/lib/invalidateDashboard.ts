import type { QueryClient } from "@tanstack/react-query";

import { dashboardKeys } from "../api/dashboardKeys";

/** Refetch all dashboard widgets after mutations that change balances, txns, or dues. */
export function invalidateDashboard(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
}
