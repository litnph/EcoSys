import type { ApiResponse } from "@/shared/types/api";
import { apiClient } from "@/shared/lib/axios";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";

import type {
  Comparison,
  CategoryBreakdownItem,
  DailyPoint,
  MonthlyPeriodListItem,
  MonthlyPeriodStatus,
  MonthlyReport,
  SourceBreakdownItem,
} from "../types";
import { daysInMonth } from "../utils/months";

type ApiEnvelope<T> = ApiResponse<T>;

function assertData<T>(body: ApiEnvelope<T>): asserts body is ApiEnvelope<T> & {
  success: true;
  data: T;
} {
  if (!body.success) {
    throw new Error(getFailureMessageFromApiBody(body));
  }
  if (body.data === null || body.data === undefined) {
    throw new Error("Phản hồi API không hợp lệ");
  }
}

async function unwrap<T>(getter: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const { data: body } = await getter;
  assertData(body);
  return body.data;
}

interface PeriodsEnvelope {
  periods: Array<{
    year: number;
    month: number;
    status: MonthlyPeriodStatus;
    totalIncome: number;
    totalExpense: number;
    net: number;
  }>;
}

interface MonthlyReportSummaryDto {
  totalIncome: number;
  totalExpense: number;
  net: number;
  savingsRatePercent: number | null;
}

interface MonthCategorySlice {
  categoryId?: string | null;
  categoryName?: string | null;
  amount: number;
  transactionCount: number;
  percentageOfTotalExpense: number;
}

interface MonthSourceSlice {
  sourceId: string;
  sourceName?: string | null;
  expenseAmount: number;
}

interface DailyCashflowSlice {
  date: string;
  income: number;
  expense: number;
}

interface MonthOverMonthComparisonDto {
  incomeChangePercent: number | null;
  expenseChangePercent: number | null;
  netChangePercent: number | null;
}

interface ReportEnvelope {
  report: {
    summary: MonthlyReportSummaryDto;
    categoryBreakdown: MonthCategorySlice[] | null;
    sourceBreakdown: MonthSourceSlice[] | null;
    dailyBreakdown: DailyCashflowSlice[] | null;
    comparisonWithPreviousMonth: MonthOverMonthComparisonDto | null;
  };
}

interface MonthlyPeriodEnvelope {
  summary: {
    year: number;
    month: number;
    status: MonthlyPeriodStatus;
    totalIncome: number;
    totalExpense: number;
    net: number;
  };
}

function mapDaily(row: DailyCashflowSlice): DailyPoint | null {
  const head = row.date.slice(0, 10);
  const [, ds] = head.split("-");
  const day = Number(ds);
  if (!Number.isFinite(day)) return null;
  return {
    day,
    income: Number(row.income),
    expense: Number(row.expense),
  };
}

export async function getMonthlyPeriods(
  ): Promise<MonthlyPeriodListItem[]> {
  const data = await unwrap<PeriodsEnvelope>(
    apiClient.get("/finance/monthly-periods"));
  return data.periods.map((p) => ({
    year: p.year,
    month: p.month,
    status: p.status,
    totalIncome: Number(p.totalIncome),
    totalExpense: Number(p.totalExpense),
    net: Number(p.net),
  }));
}

function mapCategorySlices(rows: MonthCategorySlice[]): CategoryBreakdownItem[] {
  return rows.map((row) => ({
    categoryId:
      typeof row.categoryId === "string" && row.categoryId.length > 0
        ? row.categoryId
        : null,
    categoryName: row.categoryName?.trim()?.length ? row.categoryName : "—",
    amount: Number(row.amount),
    transactionCount: Number(row.transactionCount ?? 0),
    percentageOfTotalExpense: Number(row.percentageOfTotalExpense ?? 0),
  }));
}

function mapSourceSlices(rows: MonthSourceSlice[]): SourceBreakdownItem[] {
  return rows.map((row) => ({
    sourceId: row.sourceId,
    sourceName: row.sourceName?.trim()?.length ? row.sourceName : "—",
    expenseAmount: Number(row.expenseAmount),
  }));
}

function mapComparison(dto: MonthOverMonthComparisonDto | null): Comparison {
  if (!dto) {
    return {
      incomeChangePercent: null,
      expenseChangePercent: null,
      netChangePercent: null,
    };
  }
  return {
    incomeChangePercent:
      dto.incomeChangePercent === undefined || dto.incomeChangePercent === null
        ? null
        : Number(dto.incomeChangePercent),
    expenseChangePercent:
      dto.expenseChangePercent === undefined || dto.expenseChangePercent === null
        ? null
        : Number(dto.expenseChangePercent),
    netChangePercent:
      dto.netChangePercent === undefined || dto.netChangePercent === null
        ? null
        : Number(dto.netChangePercent),
  };
}

async function fetchReportPayload(year: number, month: number) {
  const data = await unwrap<ReportEnvelope>(
    apiClient.get(
      `/finance/monthly-periods/${String(year)}/${String(month)}/report`,
    ),
  );
  return data.report;
}

async function fetchPeriodMeta(year: number, month: number) {
  const data = await unwrap<MonthlyPeriodEnvelope>(
    apiClient.get(
      `/finance/monthly-periods/${String(year)}/${String(month)}`,
    ),
  );
  return data.summary;
}

export async function getMonthlyReport(
  year: number,
  month: number): Promise<MonthlyReport> {
  const [reportSlice, summary] = await Promise.all([
    fetchReportPayload(year, month),
    fetchPeriodMeta(year, month),
  ]);

  const dailyRaw = reportSlice.dailyBreakdown ?? [];
  const mappedDaily = dailyRaw
    .map(mapDaily)
    .filter((d): d is DailyPoint => Boolean(d));

  const categoriesRaw = reportSlice.categoryBreakdown ?? [];
  const sourcesRaw = reportSlice.sourceBreakdown ?? [];

  const totalIncome = Number(reportSlice.summary.totalIncome);
  const totalExpense = Number(reportSlice.summary.totalExpense);
  const net = Number(reportSlice.summary.net);
  const savingsRaw = reportSlice.summary?.savingsRatePercent;
  const savingsRate =
    savingsRaw === null || savingsRaw === undefined
      ? null
      : Number(savingsRaw);

  return {
    year,
    month,
    status: summary.status,
    totalIncome,
    totalExpense,
    net,
    savingsRate,
    categoryBreakdown: mapCategorySlices(categoriesRaw),
    sourceBreakdown: mapSourceSlices(sourcesRaw),
    dailyBreakdown: mappedDaily.length > 0 ? mappedDaily : fillEmptyDaily(year, month),
    comparisonWithPrevious: mapComparison(reportSlice.comparisonWithPreviousMonth),
  };
}

function fillEmptyDaily(year: number, month: number): DailyPoint[] {
  const dim = daysInMonth(year, month);
  const out: DailyPoint[] = [];
  for (let d = 1; d <= dim; d++) {
    out.push({ day: d, income: 0, expense: 0 });
  }
  return out;
}

export async function closeMonth(
  year: number,
  month: number): Promise<void> {
  await unwrap<unknown>(
    apiClient.post(`/finance/monthly-periods/close`, {
      year,
      month,
    }));
}
