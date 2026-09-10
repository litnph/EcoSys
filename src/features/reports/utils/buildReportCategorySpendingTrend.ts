import type { FinCategoryFlat } from "@/features/categories/types";
import type {
  CategoryRollupLevel,
  CategorySpendingTrend,
  CategorySpendingTrendPoint,
} from "@/features/dashboard/types";
import {
  bucketCategoryForLevel,
  buildCategoryNameIndex,
} from "@/features/dashboard/utils/categoryRollup";
import { warmPaletteColor } from "@/features/dashboard/utils/warmPalette";

import type { MonthlyReport } from "../types";
import type { CategoryExpenseFilter } from "./categoryBreakdownFilter";
import { extractReportExpenseLines } from "./extractReportExpenseLines";

export type ReportTrendGroupBy = "day" | "week";

const DAY_MS = 86_400_000;

interface PeriodDef {
  label: string;
  start: number;
  end: number;
}

function parseIsoDay(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) return null;
  const timestamp = Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return Number.isFinite(timestamp) ? timestamp : null;
}

function toIsoDay(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function dayMonthLabel(timestamp: number): string {
  const date = new Date(timestamp);
  return `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function buildPeriods(
  start: number,
  end: number,
  groupBy: ReportTrendGroupBy,
): PeriodDef[] {
  const periods: PeriodDef[] = [];
  if (groupBy === "day") {
    for (let cursor = start; cursor <= end; cursor += DAY_MS) {
      periods.push({
        label: dayMonthLabel(cursor),
        start: cursor,
        end: cursor,
      });
    }
    return periods;
  }

  for (let cursor = start; cursor <= end; cursor += 7 * DAY_MS) {
    const periodEnd = Math.min(cursor + 6 * DAY_MS, end);
    periods.push({
      label: `${dayMonthLabel(cursor)}–${dayMonthLabel(periodEnd)}`,
      start: cursor,
      end: periodEnd,
    });
  }
  return periods;
}

export function buildReportCategorySpendingTrend(
  report: MonthlyReport,
  filter: CategoryExpenseFilter,
  groupBy: ReportTrendGroupBy,
  categories: FinCategoryFlat[],
  level: CategoryRollupLevel,
): CategorySpendingTrend {
  const { year, month } = report;
  const lines = extractReportExpenseLines(report, filter);
  const monthStart = Date.UTC(year, month - 1, 1);
  const monthEnd = Date.UTC(year, month, 0);
  const creditCardDates = lines
    .filter((line) => line.kind === "creditCard")
    .map((line) => parseIsoDay(line.txnDate))
    .filter((value): value is number => value !== null);
  const rangeStart = Math.min(monthStart, ...creditCardDates);
  const rangeEnd = Math.max(monthEnd, ...creditCardDates);
  const periodDefs = buildPeriods(rangeStart, rangeEnd, groupBy);
  const periodCount = periodDefs.length;

  const months: CategorySpendingTrendPoint[] = periodDefs.map((period) => {
    const date = new Date(period.start);
    return {
      label: period.label,
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      date: toIsoDay(period.start),
      endDate: toIsoDay(period.end),
    };
  });

  const expenseCategories = categories.filter((category) => category.kind === "expense");
  const categoryMap = new Map(
    expenseCategories.map((category) => [category.id, category]),
  );
  const nameIndex = buildCategoryNameIndex(expenseCategories);
  const totals = new Map<string, { name: string; amounts: number[] }>();

  for (const line of lines) {
    const timestamp = parseIsoDay(line.txnDate);
    if (timestamp === null) continue;
    const periodIndex = periodDefs.findIndex(
      (period) => timestamp >= period.start && timestamp <= period.end,
    );
    if (periodIndex < 0) continue;

    const bucket = bucketCategoryForLevel(
      line.categoryId,
      line.categoryName ?? "—",
      level,
      categoryMap,
      nameIndex,
    );
    const current = totals.get(bucket.key) ?? {
      name: bucket.name,
      amounts: Array.from({ length: periodCount }, () => 0),
    };
    current.amounts[periodIndex] =
      (current.amounts[periodIndex] ?? 0) + line.amount;
    totals.set(bucket.key, current);
  }

  const series = [...totals.entries()]
    .map(([key, row]) => ({
      key,
      name: row.name,
      total: row.amounts.reduce((sum, value) => sum + value, 0),
      amounts: row.amounts,
    }))
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total)
    .map((row, index) => ({
      key: row.key,
      name: row.name,
      color: warmPaletteColor(index),
      amounts: row.amounts,
    }));

  return { months, series };
}
