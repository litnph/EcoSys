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
  MonthlyReportBillingCycleItem,
  MonthlyReportBillingCycleInstallmentDue,
  MonthlyReportBillingCycleStatus,
  MonthlyReportBillingCyclesSection,
  MonthlyReportCurrencyGroup,
  MonthlyReportDirectExpenseItem,
  MonthlyReportDirectExpenseSection,
  MonthlyReportInstallmentPayStatus,
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
    reportCreatedAt: string;
    lastRefreshedAt?: string | null;
    closedAt?: string | null;
    currency?: string | null;
    consolidatedTotalsAvailable?: boolean;
    currencyGroups?: Array<{
      currency: string;
      totalIncome: number;
      totalExpense: number;
      net: number;
      savingsRatePercent?: number | null;
    }> | null;
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

interface MonthlyReportMetadataDto {
  formulaVersion: string;
  metricBasis: string;
  currency?: string | null;
  timeZone: string;
  consolidatedTotalsAvailable?: boolean;
}

interface MonthlyReportDirectExpenseItemDto {
  id: string;
  amount: number;
  currency: string;
  txnDate: string;
  description: string;
  categoryName?: string | null;
  sourceName: string;
}

interface MonthlyReportDirectExpenseSectionDto {
  totalAmount: number;
  transactionCount: number;
  items: MonthlyReportDirectExpenseItemDto[];
}

interface MonthlyReportBillingCycleTxnItemDto {
  id: string;
  amount: number;
  txnDate: string;
  description: string;
  categoryName?: string | null;
}

interface MonthlyReportBillingCycleInstallmentDueDto {
  payId: string;
  planId: string;
  planDescription: string;
  categoryName?: string | null;
  installmentNumber: number;
  totalInstallments: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: string;
}

interface MonthlyReportBillingCycleItemDto {
  id: string;
  sourceId: string;
  sourceName: string;
  name: string;
  periodStart: string;
  periodEnd: string;
  statementDate: string;
  paymentDueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  transactions: MonthlyReportBillingCycleTxnItemDto[];
  installmentDues?: MonthlyReportBillingCycleInstallmentDueDto[];
}

interface MonthlyReportBillingCyclesSectionDto {
  totalAmount: number;
  cycleCount: number;
  cycles: MonthlyReportBillingCycleItemDto[];
}

interface MonthlyReportCurrencyGroupDto {
  currency: string;
  summary: MonthlyReportSummaryDto;
  categoryBreakdown: MonthCategorySlice[] | null;
  sourceBreakdown: MonthSourceSlice[] | null;
  dailyBreakdown: DailyCashflowSlice[] | null;
  comparisonWithPreviousMonth: MonthOverMonthComparisonDto | null;
  directExpenses: MonthlyReportDirectExpenseSectionDto | null;
  billingCycles: MonthlyReportBillingCyclesSectionDto | null;
}

interface ReportEnvelope {
  status: MonthlyPeriodStatus;
  report: {
    summary: MonthlyReportSummaryDto;
    categoryBreakdown: MonthCategorySlice[] | null;
    sourceBreakdown: MonthSourceSlice[] | null;
    dailyBreakdown: DailyCashflowSlice[] | null;
    comparisonWithPreviousMonth: MonthOverMonthComparisonDto | null;
    directExpenses: MonthlyReportDirectExpenseSectionDto | null;
    billingCycles: MonthlyReportBillingCyclesSectionDto | null;
    metadata?: MonthlyReportMetadataDto | null;
    currencyGroups?: MonthlyReportCurrencyGroupDto[] | null;
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
    reportCreatedAt: p.reportCreatedAt,
    lastRefreshedAt: p.lastRefreshedAt ?? null,
    closedAt: p.closedAt ?? null,
    currency: p.currency ?? null,
    consolidatedTotalsAvailable: p.consolidatedTotalsAvailable ?? true,
    currencyGroups: (p.currencyGroups ?? []).map((group) => ({
      currency: group.currency,
      totalIncome: Number(group.totalIncome),
      totalExpense: Number(group.totalExpense),
      net: Number(group.net),
      savingsRatePercent:
        group.savingsRatePercent === null || group.savingsRatePercent === undefined
          ? null
          : Number(group.savingsRatePercent),
    })),
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

function mapDirectExpenseItem(
  row: MonthlyReportDirectExpenseItemDto,
): MonthlyReportDirectExpenseItem {
  return {
    id: row.id,
    amount: Number(row.amount),
    currency: row.currency,
    txnDate: row.txnDate,
    description: row.description?.trim()?.length ? row.description : "—",
    categoryName: row.categoryName?.trim()?.length ? row.categoryName : null,
    sourceName: row.sourceName?.trim()?.length ? row.sourceName : "—",
  };
}

function mapDirectExpenses(
  dto: MonthlyReportDirectExpenseSectionDto | null | undefined,
): MonthlyReportDirectExpenseSection {
  const items = (dto?.items ?? []).map(mapDirectExpenseItem);
  return {
    totalAmount: Number(dto?.totalAmount ?? 0),
    transactionCount: Number(dto?.transactionCount ?? items.length),
    items,
  };
}

function normalizeBillingCycleStatus(status: string): MonthlyReportBillingCycleStatus {
  if (
    status === "open"
    || status === "closed"
    || status === "paid"
    || status === "overdue"
  ) {
    return status;
  }
  return "open";
}

function normalizeInstallmentPayStatus(status: string): MonthlyReportInstallmentPayStatus {
  const s = status.toLowerCase();
  if (s === "paid") return "paid";
  if (s === "due") return "due";
  if (s === "overdue") return "overdue";
  return "upcoming";
}

function mapBillingCycleInstallmentDue(
  row: MonthlyReportBillingCycleInstallmentDueDto,
): MonthlyReportBillingCycleInstallmentDue {
  return {
    payId: row.payId,
    planId: row.planId,
    planDescription: row.planDescription?.trim()?.length ? row.planDescription : "Trả góp",
    categoryName: row.categoryName?.trim()?.length ? row.categoryName : null,
    installmentNumber: row.installmentNumber,
    totalInstallments: row.totalInstallments,
    dueDate: row.dueDate,
    amount: Number(row.amount),
    paidAmount: Number(row.paidAmount),
    status: normalizeInstallmentPayStatus(row.status),
  };
}

function mapBillingCycleItem(
  row: MonthlyReportBillingCycleItemDto,
  currency: string,
): MonthlyReportBillingCycleItem {
  return {
    id: row.id,
    currency,
    sourceId: row.sourceId,
    sourceName: row.sourceName?.trim()?.length ? row.sourceName : "—",
    name: row.name?.trim()?.length ? row.name : "—",
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    statementDate: row.statementDate,
    paymentDueDate: row.paymentDueDate,
    totalAmount: Number(row.totalAmount),
    paidAmount: Number(row.paidAmount),
    status: normalizeBillingCycleStatus(row.status),
    transactions: (row.transactions ?? []).map((txn) => ({
      id: txn.id,
      amount: Number(txn.amount),
      txnDate: txn.txnDate,
      description: txn.description?.trim()?.length ? txn.description : "—",
      categoryName: txn.categoryName?.trim()?.length ? txn.categoryName : null,
    })),
    installmentDues: (row.installmentDues ?? []).map(mapBillingCycleInstallmentDue),
  };
}

function mapBillingCycles(
  dto: MonthlyReportBillingCyclesSectionDto | null | undefined,
  currency = "VND",
): MonthlyReportBillingCyclesSection {
  const cycles = (dto?.cycles ?? []).map((row) =>
    mapBillingCycleItem(row, currency));
  return {
    totalAmount: Number(dto?.totalAmount ?? 0),
    cycleCount: Number(dto?.cycleCount ?? cycles.length),
    cycles,
  };
}

async function fetchReportPayload(year: number, month: number) {
  const data = await unwrap<ReportEnvelope>(
    apiClient.get(
      `/finance/monthly-periods/${String(year)}/${String(month)}/report`,
    ),
  );
  return data;
}

function mapCurrencyGroup(
  dto: MonthlyReportCurrencyGroupDto,
  year: number,
  month: number,
): MonthlyReportCurrencyGroup {
  const mappedDaily = (dto.dailyBreakdown ?? [])
    .map(mapDaily)
    .filter((day): day is DailyPoint => Boolean(day));
  const savingsRaw = dto.summary.savingsRatePercent;

  return {
    currency: dto.currency,
    totalIncome: Number(dto.summary.totalIncome),
    totalExpense: Number(dto.summary.totalExpense),
    net: Number(dto.summary.net),
    savingsRate:
      savingsRaw === null || savingsRaw === undefined
        ? null
        : Number(savingsRaw),
    categoryBreakdown: mapCategorySlices(dto.categoryBreakdown ?? []),
    sourceBreakdown: mapSourceSlices(dto.sourceBreakdown ?? []),
    dailyBreakdown:
      mappedDaily.length > 0 ? mappedDaily : fillEmptyDaily(year, month),
    comparisonWithPrevious: mapComparison(dto.comparisonWithPreviousMonth),
    directExpenses: mapDirectExpenses(dto.directExpenses),
    billingCycles: mapBillingCycles(dto.billingCycles, dto.currency),
  };
}

export async function getMonthlyReport(
  year: number,
  month: number): Promise<MonthlyReport> {
  const { report: reportSlice, status } = await fetchReportPayload(year, month);

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
  const currencyGroups = (reportSlice.currencyGroups ?? []).map((group) =>
    mapCurrencyGroup(group, year, month));

  return {
    year,
    month,
    status,
    totalIncome,
    totalExpense,
    net,
    savingsRate,
    categoryBreakdown: mapCategorySlices(categoriesRaw),
    sourceBreakdown: mapSourceSlices(sourcesRaw),
    dailyBreakdown: mappedDaily.length > 0 ? mappedDaily : fillEmptyDaily(year, month),
    comparisonWithPrevious: mapComparison(reportSlice.comparisonWithPreviousMonth),
    directExpenses: mapDirectExpenses(reportSlice.directExpenses),
    billingCycles: mapBillingCycles(
      reportSlice.billingCycles,
      reportSlice.metadata?.currency ?? "VND",
    ),
    metadata: reportSlice.metadata
      ? {
          formulaVersion: reportSlice.metadata.formulaVersion,
          metricBasis: reportSlice.metadata.metricBasis,
          currency: reportSlice.metadata.currency ?? null,
          timeZone: reportSlice.metadata.timeZone,
          consolidatedTotalsAvailable:
            reportSlice.metadata.consolidatedTotalsAvailable ?? true,
        }
      : null,
    currencyGroups,
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

export async function createMonthlyReport(
  year: number,
  month: number,
): Promise<void> {
  await unwrap<unknown>(
    apiClient.post(`/finance/monthly-periods/reports`, { year, month }),
  );
}

export async function refreshMonthlyReport(
  year: number,
  month: number,
): Promise<void> {
  await unwrap<unknown>(
    apiClient.post(
      `/finance/monthly-periods/${String(year)}/${String(month)}/refresh`,
    ),
  );
}

export async function deleteMonthlyReport(
  year: number,
  month: number,
): Promise<void> {
  await unwrap<unknown>(
    apiClient.delete(
      `/finance/monthly-periods/${String(year)}/${String(month)}`,
    ),
  );
}
