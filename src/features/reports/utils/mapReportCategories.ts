import { warmPaletteColor } from "@/features/dashboard/utils/warmPalette";
import type { CategoryBreakdown } from "@/features/dashboard/types";

import type { CategoryBreakdownItem } from "../types";

export function mapReportCategoriesToChart(
  items: CategoryBreakdownItem[],
): CategoryBreakdown[] {
  return items.map((item, idx) => ({
    categoryId: item.categoryId ?? `report-cat-${idx}`,
    categoryName: item.categoryName,
    amount: item.amount,
    percentage: item.percentageOfTotalExpense,
    color: warmPaletteColor(idx),
  }));
}
