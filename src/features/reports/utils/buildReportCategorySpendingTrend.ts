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

const MAX_SERIES = 6;

interface PeriodDef {
  label: string;
  matchDay: (day: number) => boolean;
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function buildPeriods(
  year: number,
  month: number,
  groupBy: ReportTrendGroupBy,
): PeriodDef[] {
  const last = lastDayOfMonth(year, month);

  if (groupBy === "day") {
    return Array.from({ length: last }, (_, i) => {
      const day = i + 1;
      return {
        label: String(day).padStart(2, "0"),
        matchDay: (d) => d === day,
      };
    });
  }

  const periods: PeriodDef[] = [];
  let start = 1;
  let weekNum = 1;
  while (start <= last) {
    const end = Math.min(start + 6, last);
    const rangeStart = start;
    const rangeEnd = end;
    periods.push({
      label: `Tuần ${weekNum} (${String(rangeStart).padStart(2, "0")}–${String(rangeEnd).padStart(2, "0")})`,
      matchDay: (d) => d >= rangeStart && d <= rangeEnd,
    });
    start = end + 1;
    weekNum += 1;
  }
  return periods;
}

function parseExpenseDay(
  txnDate: string,
  year: number,
  month: number,
): number | null {
  const normalized = txnDate.trim();
  if (!normalized) return null;
  const iso = normalized.includes("T")
    ? normalized
    : `${normalized}T12:00:00`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  if (d.getFullYear() !== year || d.getMonth() + 1 !== month) return null;
  return d.getDate();
}

export function buildReportCategorySpendingTrend(
  report: MonthlyReport,
  filter: CategoryExpenseFilter,
  groupBy: ReportTrendGroupBy,
  categories: FinCategoryFlat[],
  level: CategoryRollupLevel,
): CategorySpendingTrend {
  const { year, month } = report;
  const periodDefs = buildPeriods(year, month, groupBy);
  const periodCount = periodDefs.length;

  const months: CategorySpendingTrendPoint[] = periodDefs.map((p) => ({
    label: p.label,
    year,
    month,
  }));

  const expenseCats = categories.filter((c) => c.kind === "expense");
  const categoryMap = new Map(expenseCats.map((c) => [c.id, c]));
  const nameIndex = buildCategoryNameIndex(expenseCats);
  const lines = extractReportExpenseLines(report, filter);

  const totals = new Map<string, { name: string; amounts: number[] }>();

  for (const line of lines) {
    const day = parseExpenseDay(line.txnDate, year, month);
    if (day === null) continue;

    const periodIdx = periodDefs.findIndex((p) => p.matchDay(day));
    if (periodIdx < 0) continue;

    const bucket = bucketCategoryForLevel(
      line.categoryId,
      line.categoryName ?? "—",
      level,
      categoryMap,
      nameIndex,
    );

    if (!totals.has(bucket.key)) {
      totals.set(bucket.key, {
        name: bucket.name,
        amounts: Array.from({ length: periodCount }, () => 0),
      });
    }
    const row = totals.get(bucket.key)!;
    if (row.name === "—" && bucket.name !== "—") {
      row.name = bucket.name;
    }
    row.amounts[periodIdx] = (row.amounts[periodIdx] ?? 0) + line.amount;
  }

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
    const otherAmounts = Array.from({ length: periodCount }, (_, periodIdx) =>
      rest.reduce((sum, row) => sum + (row.amounts[periodIdx] ?? 0), 0),
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
