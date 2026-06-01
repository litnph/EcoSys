import type { FinCategoryFlat } from "@/features/categories/types";
import type { CategoryBreakdownItem } from "@/features/reports/types";

import {
  bucketCategoryForLevel,
  buildCategoryNameIndex,
} from "./categoryRollup";
import { warmPaletteColor } from "./warmPalette";
import type {
  CategoryRollupLevel,
  CategorySpendingTrend,
  CategorySpendingTrendPoint,
  MonthlyTrendPoint,
} from "../types";

const MAX_SERIES = 6;

export function buildCategorySpendingTrend(
  periods: MonthlyTrendPoint[],
  reportsByMonth: Map<string, CategoryBreakdownItem[]>,
  categories: FinCategoryFlat[],
  level: CategoryRollupLevel,
): CategorySpendingTrend {
  const expenseCats = categories.filter((c) => c.kind === "expense");
  const categoryMap = new Map(expenseCats.map((c) => [c.id, c]));
  const nameIndex = buildCategoryNameIndex(expenseCats);

  const months: CategorySpendingTrendPoint[] = periods.map((p) => ({
    label: `${String(p.month).padStart(2, "0")}/${String(p.year)}`,
    year: p.year,
    month: p.month,
  }));

  const totals = new Map<string, { name: string; amounts: number[] }>();

  periods.forEach((period, monthIdx) => {
    const monthKey = `${String(period.year)}-${String(period.month)}`;
    const slices = reportsByMonth.get(monthKey) ?? [];
    const monthBuckets = new Map<string, { name: string; amount: number }>();

    for (const slice of slices) {
      const bucket = bucketCategoryForLevel(
        slice.categoryId,
        slice.categoryName,
        level,
        categoryMap,
        nameIndex,
      );
      const cur = monthBuckets.get(bucket.key);
      monthBuckets.set(bucket.key, {
        name: bucket.name,
        amount: (cur?.amount ?? 0) + slice.amount,
      });
    }

    for (const [key, { name, amount }] of monthBuckets) {
      if (!totals.has(key)) {
        totals.set(key, {
          name,
          amounts: Array.from({ length: periods.length }, () => 0),
        });
      }
      const row = totals.get(key)!;
      if (row.name === "—" && name !== "—") {
        row.name = name;
      }
      row.amounts[monthIdx] = amount;
    }
  });

  const ranked = [...totals.entries()]
    .map(([key, row]) => ({
      key,
      name: row.name,
      total: row.amounts.reduce((s, v) => s + v, 0),
      amounts: row.amounts,
    }))
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total);

  const top = ranked.slice(0, MAX_SERIES);
  const rest = ranked.slice(MAX_SERIES);

  const series = top.map((row, idx) => ({
    key: row.key,
    name: row.name,
    color: warmPaletteColor(idx),
    amounts: row.amounts,
  }));

  if (rest.length > 0) {
    const otherAmounts = months.map((_, monthIdx) =>
      rest.reduce((sum, row) => sum + (row.amounts[monthIdx] ?? 0), 0),
    );
    if (otherAmounts.some((v) => v > 0)) {
      series.push({
        key: "__other__",
        name: "Khác",
        color: warmPaletteColor(series.length),
        amounts: otherAmounts,
      });
    }
  }

  return { months, series };
}
