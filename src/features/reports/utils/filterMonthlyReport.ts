import type {
  CategoryBreakdownItem,
  DailyPoint,
  MonthlyReport,
  MonthlyReportBillingCycleItem,
} from "../types";

export interface MonthlyReportFilters {
  /** null means all sources; an empty array intentionally hides every source. */
  sourceIds: string[] | null;
}

export function defaultMonthlyReportFilters(): MonthlyReportFilters {
  return { sourceIds: null };
}

export function isMonthlyReportFiltered(filters: MonthlyReportFilters): boolean {
  return filters.sourceIds !== null;
}

function dayOfReportDate(
  value: string,
  year: number,
  month: number,
): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) return null;
  const rowYear = Number(match[1]);
  const rowMonth = Number(match[2]);
  const day = Number(match[3]);
  if (rowYear !== year || rowMonth !== month || !Number.isInteger(day)) {
    return null;
  }
  return day;
}

function rebuildCategories(
  directItems: MonthlyReport["directExpenses"]["items"],
  cycles: MonthlyReportBillingCycleItem[],
  totalExpense: number,
): CategoryBreakdownItem[] {
  const rows = new Map<
    string,
    { categoryId: string | null; categoryName: string; amount: number; count: number }
  >();

  const add = (
    categoryId: string | null,
    categoryName: string | null,
    amount: number,
  ) => {
    const name = categoryName?.trim() || "Chưa phân loại";
    const key = categoryId ?? `name:${name}`;
    const current = rows.get(key) ?? {
      categoryId,
      categoryName: name,
      amount: 0,
      count: 0,
    };
    rows.set(key, {
      ...current,
      amount: current.amount + amount,
      count: current.count + 1,
    });
  };

  directItems.forEach((item) => add(item.categoryId, item.categoryName, item.amount));
  cycles.forEach((cycle) => {
    cycle.transactions.forEach((item) =>
      add(item.categoryId, item.categoryName, item.amount),
    );
    cycle.installmentDues.forEach((item) =>
      add(item.categoryId, item.categoryName, item.amount),
    );
  });

  return [...rows.values()]
    .map((row) => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      amount: row.amount,
      transactionCount: row.count,
      percentageOfTotalExpense:
        totalExpense > 0
          ? Math.round((row.amount / totalExpense) * 10_000) / 100
          : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

function rebuildDaily(
  report: MonthlyReport,
  directItems: MonthlyReport["directExpenses"]["items"],
  cycles: MonthlyReportBillingCycleItem[],
): DailyPoint[] {
  const expenses = new Map<number, number>();
  const add = (value: string, amount: number) => {
    const day = dayOfReportDate(value, report.year, report.month);
    if (day !== null) expenses.set(day, (expenses.get(day) ?? 0) + amount);
  };

  directItems.forEach((item) => add(item.txnDate, item.amount));
  cycles.forEach((cycle) => add(cycle.statementDate, cycle.totalAmount));

  return report.dailyBreakdown.map((point) => ({
    day: point.day,
    income: point.income,
    expense: expenses.get(point.day) ?? 0,
  }));
}

export function filterMonthlyReport(
  report: MonthlyReport,
  filters: MonthlyReportFilters,
): MonthlyReport {
  if (filters.sourceIds === null) return report;

  const selectedSourceIds = new Set(filters.sourceIds);
  const directItems = report.directExpenses.items.filter((item) =>
    selectedSourceIds.has(item.sourceId),
  );
  const cycles = report.billingCycles.cycles.filter((cycle) =>
    selectedSourceIds.has(cycle.sourceId),
  );

  const directTotal = directItems.reduce((total, item) => total + item.amount, 0);
  const billingTotal = cycles.reduce((total, cycle) => total + cycle.totalAmount, 0);
  const totalExpense = directTotal + billingTotal;
  const totalIncome = report.totalIncome;
  const net = totalIncome - totalExpense;

  return {
    ...report,
    totalExpense,
    net,
    savingsRate:
      totalIncome > 0 ? Math.round((net / totalIncome) * 10_000) / 100 : null,
    categoryBreakdown: rebuildCategories(directItems, cycles, totalExpense),
    sourceBreakdown: report.sourceBreakdown.filter((source) =>
      selectedSourceIds.has(source.sourceId),
    ),
    dailyBreakdown: rebuildDaily(report, directItems, cycles),
    comparisonWithPrevious: {
      incomeChangePercent: null,
      expenseChangePercent: null,
      netChangePercent: null,
    },
    directExpenses: {
      totalAmount: directTotal,
      transactionCount: directItems.length,
      items: directItems,
    },
    billingCycles: {
      totalAmount: billingTotal,
      cycleCount: cycles.length,
      cycles,
    },
  };
}
