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
  monthlyTrend: (months: number) =>
    [...dashboardKeys.all, "monthlyTrend", months] as const,
  metrics: () => [...dashboardKeys.all, "metrics"] as const,
  categorySpendingTrend: (months: number) =>
    [...dashboardKeys.all, "categorySpendingTrend", months] as const,
} as const;
