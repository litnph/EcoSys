import type { CategoryBreakdownItem, MonthlyReport } from "../types";

export type CategoryExpenseFilter = "all" | "transactions" | "installments";

function categoryLabel(name: string | null | undefined): string {
  const trimmed = name?.trim();
  return trimmed?.length ? trimmed : "—";
}

export function buildFilteredCategoryBreakdown(
  report: Pick<
    MonthlyReport,
    "categoryBreakdown" | "directExpenses" | "billingCycles"
  >,
  filter: CategoryExpenseFilter,
): CategoryBreakdownItem[] {
  if (filter === "all") {
    return report.categoryBreakdown;
  }

  const map = new Map<string, { amount: number; count: number }>();

  const add = (categoryName: string | null | undefined, amount: number) => {
    const name = categoryLabel(categoryName);
    const cur = map.get(name) ?? { amount: 0, count: 0 };
    map.set(name, { amount: cur.amount + amount, count: cur.count + 1 });
  };

  if (filter === "transactions") {
    for (const item of report.directExpenses.items) {
      add(item.categoryName, item.amount);
    }
    for (const cycle of report.billingCycles.cycles) {
      for (const txn of cycle.transactions) {
        add(txn.categoryName, txn.amount);
      }
    }
  } else {
    for (const cycle of report.billingCycles.cycles) {
      for (const due of cycle.installmentDues) {
        add(due.categoryName, due.amount);
      }
    }
  }

  const total = [...map.values()].reduce((sum, row) => sum + row.amount, 0);

  return [...map.entries()]
    .map(([categoryName, row]) => ({
      categoryId: null,
      categoryName,
      amount: row.amount,
      transactionCount: row.count,
      percentageOfTotalExpense:
        total > 0
          ? Math.round((row.amount / total) * 10000) / 100
          : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}
