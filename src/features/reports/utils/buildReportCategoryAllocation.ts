import type { FinCategoryFlat } from "@/features/categories/types";
import type { CategoryRollupLevel } from "@/features/dashboard/types";
import {
  bucketCategoryForLevel,
  buildCategoryNameIndex,
} from "@/features/dashboard/utils/categoryRollup";

import type { CategoryBreakdownItem, MonthlyReport } from "../types";
import {
  buildFilteredCategoryBreakdown,
  type CategoryExpenseFilter,
} from "./categoryBreakdownFilter";

export function buildReportCategoryAllocation(
  report: MonthlyReport,
  filter: CategoryExpenseFilter,
  categories: FinCategoryFlat[],
  level: CategoryRollupLevel,
): CategoryBreakdownItem[] {
  const sourceRows = buildFilteredCategoryBreakdown(report, filter);
  const expenseCategories = categories.filter((category) => category.kind === "expense");
  const categoryMap = new Map(
    expenseCategories.map((category) => [category.id, category]),
  );
  const nameIndex = buildCategoryNameIndex(expenseCategories);
  const buckets = new Map<
    string,
    { categoryName: string; amount: number; transactionCount: number }
  >();

  for (const row of sourceRows) {
    const bucket = bucketCategoryForLevel(
      row.categoryId,
      row.categoryName,
      level,
      categoryMap,
      nameIndex,
    );
    const current = buckets.get(bucket.key) ?? {
      categoryName: bucket.name,
      amount: 0,
      transactionCount: 0,
    };
    buckets.set(bucket.key, {
      categoryName: current.categoryName,
      amount: current.amount + row.amount,
      transactionCount: current.transactionCount + row.transactionCount,
    });
  }

  const total = [...buckets.values()].reduce(
    (sum, bucket) => sum + bucket.amount,
    0,
  );

  return [...buckets.entries()]
    .map(([categoryId, bucket]) => ({
      categoryId,
      categoryName: bucket.categoryName,
      amount: bucket.amount,
      transactionCount: bucket.transactionCount,
      percentageOfTotalExpense:
        total > 0
          ? Math.round((bucket.amount / total) * 10_000) / 100
          : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}
