/** Volatile dashboard widgets (balances, recent txns, dues). */
export const DASHBOARD_LIVE_QUERY_OPTIONS = {
  staleTime: 15_000,
  refetchInterval: 30_000,
  refetchIntervalInBackground: false,
} as const;

/** Charts and aggregates that change less often but still track spending. */
export const DASHBOARD_CHART_QUERY_OPTIONS = {
  staleTime: 45_000,
  refetchInterval: 90_000,
  refetchIntervalInBackground: false,
} as const;
