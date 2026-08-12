export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: () =>
    [...dashboardKeys.all, "summary"] as const,
  sources: () =>
    [...dashboardKeys.all, "sources"] as const,
  recentTransactions: (limit: number) =>
    [...dashboardKeys.all, "recentTransactions", limit] as const,
  upcomingDues: () =>
    [...dashboardKeys.all, "upcomingDues"] as const,
  spendingByCategory: (year: number, month: number) =>
    [
      ...dashboardKeys.all,
      "spendingByCategory",
      year,
      month,
    ] as const,
  monthlyTrend: (months: number, currency: string) =>
    [...dashboardKeys.all, "monthlyTrend", months, currency] as const,
  metrics: () => [...dashboardKeys.all, "metrics"] as const,
  categorySpendingTrend: (months: number, currency: string) =>
    [...dashboardKeys.all, "categorySpendingTrend", months, currency] as const,
} as const;
