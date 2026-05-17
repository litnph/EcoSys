export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: (smoduleId: string) =>
    [...dashboardKeys.all, "summary", smoduleId] as const,
  sources: (smoduleId: string) =>
    [...dashboardKeys.all, "sources", smoduleId] as const,
  recentTransactions: (smoduleId: string, limit: number) =>
    [...dashboardKeys.all, "recentTransactions", smoduleId, limit] as const,
  upcomingDues: (smoduleId: string) =>
    [...dashboardKeys.all, "upcomingDues", smoduleId] as const,
  spendingByCategory: (smoduleId: string, year: number, month: number) =>
    [
      ...dashboardKeys.all,
      "spendingByCategory",
      smoduleId,
      year,
      month,
    ] as const,
  monthlyTrend: (smoduleId: string, months: number) =>
    [...dashboardKeys.all, "monthlyTrend", smoduleId, months] as const,
} as const;
