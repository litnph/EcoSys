import type { ApiResponse } from "@/shared/types/api";
import { apiClient } from "@/shared/lib/axios";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";

import { getFlatCategories } from "@/features/categories/api/categoriesApi";
import { getDebtRecords } from "@/features/debt/api/debtApi";
import { getMonthlyReport } from "@/features/reports/api/reportsApi";
import type { CategoryBreakdownItem } from "@/features/reports/types";
import { getSavings } from "@/features/savings/api/savingsApi";
import { getSources } from "@/features/sources/api/sourcesApi";

import { buildCategorySpendingTrend } from "../utils/categorySpendingTrend";
import { computeDashboardMetrics } from "../utils/computeDashboardMetrics";
import { warmPaletteColor } from "../utils/warmPalette";
import type {
  BillingCycleDue,
  BillingCycleStatus,
  CategoryBreakdown,
  CategorySpendingTrendBundle,
  DashboardMetrics,
  DashboardSummary,
  InstallmentPayDue,
  InstallmentPayLineStatus,
  MonthlyTrendPoint,
  SourceSummary,
  Transaction,
  TransactionType,
  TxnStatus,
  UpcomingDuesPayload,
} from "../types";

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

interface RemoteSourceDto {
  id: string;
  name: string;
  type: string;
  balance: number;
  creditLimit?: number | null;
}

interface SourcesEnvelope {
  sources: RemoteSourceDto[];
}

interface MonthlyPeriodSummary {
  periodId?: string | null;
  totalIncome: number;
  totalExpense: number;
  net?: number;
}

interface CurrentMonthEnvelope {
  summary: MonthlyPeriodSummary;
}

interface MonthlyPeriodRow {
  year: number;
  month: number;
  totalIncome: number;
  totalExpense: number;
  net: number;
  currency?: string | null;
  currencyGroups?: Array<{
    currency: string;
    totalIncome: number;
    totalExpense: number;
    net: number;
  }> | null;
}

interface PeriodsEnvelope {
  periods: MonthlyPeriodRow[];
}

interface TransactionRow {
  id: string;
  type: TransactionType;
  status: TxnStatus;
  amount: number;
  currency: string;
  txnDate: string;
  sourceId: string;
  sourceName: string;
  categoryId?: string | null;
  categoryName?: string | null;
  description: string;
  note?: string | null;
  createdAt: string;
}

interface TransactionsEnvelope {
  items: TransactionRow[];
}

interface MonthCategorySlice {
  categoryId?: string | null;
  categoryName: string;
  amount: number;
  percentageOfTotalExpense?: number;
}

interface MonthlyReportEnvelope {
  report: {
    categoryBreakdown: MonthCategorySlice[];
  };
}

interface BillingCycleRow {
  id: string;
  sourceId: string;
  sourceName: string;
  periodStart: string;
  periodEnd: string;
  statementDate: string;
  paymentDueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: BillingCycleStatus;
}

interface BillingCyclesEnvelope {
  items: BillingCycleRow[];
}

interface InstallmentPlanSummary {
  id: string;
}

interface InstallmentPlansEnvelope {
  items: InstallmentPlanSummary[];
}

interface InstallmentPaySlice {
  installmentNumber: number;
  statementDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: InstallmentPayLineStatus;
}

interface InstallmentPlanDetailEnvelope {
  plan: {
    id: string;
    originalTxnDescription: string;
    pays: InstallmentPaySlice[];
  };
}

function normalizeSourceSummary(raw: RemoteSourceDto): SourceSummary {
  const typeKey = raw.type.toLowerCase();
  const isCard =
    raw.type === "creditCard" ||
    raw.type === "credit_card" ||
    typeKey.includes("credit");
  const limit =
    typeof raw.creditLimit === "number"
      ? raw.creditLimit
      : raw.creditLimit ?? null;

  let usedPct: number | null = null;
  if (
    isCard &&
    limit !== null &&
    limit !== undefined &&
    limit > 0
  ) {
    usedPct = Math.min(100, Math.round((raw.balance / limit) * 1000) / 10);
  }

  return {
    sourceId: raw.id,
    sourceName: raw.name,
    type: raw.type,
    balance: raw.balance,
    creditLimit:
      typeof limit === "number" ? limit : null,
    usedPercentage: usedPct,
  };
}

function mapTransactions(rows: TransactionRow[]): Transaction[] {
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    status: row.status,
    amount: row.amount,
    currency: row.currency,
    txnDate: row.txnDate,
    sourceId: row.sourceId,
    sourceName: row.sourceName,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    description: row.description,
    note: row.note,
    createdAt: row.createdAt,
  }));
}

export async function getSummary(): Promise<DashboardSummary> {
  const [sourcesData, currentData, periodsData] = await Promise.all([
    unwrap<SourcesEnvelope>(apiClient.get("/finance/sources")),
    unwrap<CurrentMonthEnvelope>(
      apiClient.get("/finance/monthly-periods/current")),
    unwrap<PeriodsEnvelope>(apiClient.get("/finance/monthly-periods")),
  ]);

  const netWorth = sourcesData.sources.reduce((sum, s) => sum + s.balance, 0);

  const inc = currentData.summary.totalIncome;
  const exp = currentData.summary.totalExpense;
  const savingsRate =
    inc > 0 ? Math.round(((inc - exp) / inc) * 10000) / 100 : 0;

  const previousMonthNet =
    periodsData.periods.length > 1
      ? periodsData.periods[1]?.net ?? 0
      : 0;

  return {
    netWorth,
    monthlyIncome: inc,
    monthlyExpense: exp,
    monthlySavingsRate: Math.max(-999.99, Math.min(999.99, savingsRate)),
    previousMonthNet,
  };
}

export async function getSourcesSummary(
  ): Promise<SourceSummary[]> {
  const envelope = await unwrap<SourcesEnvelope>(
    apiClient.get("/finance/sources"));
  return envelope.sources.map(normalizeSourceSummary);
}

export async function getRecentTransactions(
  limit = 5): Promise<Transaction[]> {
  const qs = new URLSearchParams({
    page: "1",
    page_size: String(limit),
  });
  const data = await unwrap<TransactionsEnvelope>(
    apiClient.get(`/finance/transactions?${qs.toString()}`));
  return mapTransactions(data.items);
}

async function fetchInstallmentDueLines(
  ): Promise<InstallmentPayDue[]> {
  const listQs = new URLSearchParams({
    status: "active",
  });
  const list = await unwrap<InstallmentPlansEnvelope>(
    apiClient.get(`/finance/installment-plans?${listQs.toString()}`));

  const dues: InstallmentPayDue[] = [];
  const capped = list.items.slice(0, 20);

  await Promise.all(
    capped.map(async (p) => {
      const detail = await unwrap<InstallmentPlanDetailEnvelope>(
        apiClient.get(`/finance/installment-plans/${p.id}`));
      const unpaid = detail.plan.pays.filter((pay) => pay.status !== "paid");
      for (const pay of unpaid) {
        const remainingAmount = Math.max(0, pay.amount - pay.paidAmount);
        if (remainingAmount <= 0) continue;
        dues.push({
          planId: detail.plan.id,
          planDescription: detail.plan.originalTxnDescription,
          installmentNumber: pay.installmentNumber,
          statementDate: pay.statementDate,
          dueDate: pay.dueDate,
          amount: pay.amount,
          remainingAmount,
          status: pay.status,
        });
      }
    }));

  return dues;
}

export async function getUpcomingDues(
  ): Promise<UpcomingDuesPayload> {
  const cyclesData = await unwrap<BillingCyclesEnvelope>(
    apiClient.get("/finance/billing-cycles"));

  const billingCycles: BillingCycleDue[] = [];
  for (const c of cyclesData.items) {
    if (c.status === "paid") continue;
    const amountDue = Math.max(0, c.totalAmount - c.paidAmount);
    if (amountDue <= 0) continue;
    billingCycles.push({
      id: c.id,
      sourceId: c.sourceId,
      sourceName: c.sourceName,
      paymentDueDate: c.paymentDueDate,
      amountDue,
      status: c.status,
    });
  }

  const installmentPays = await fetchInstallmentDueLines();

  const sortedCycles = [...billingCycles].sort((a, b) =>
    a.paymentDueDate.localeCompare(b.paymentDueDate));
  const sortedInstallments = [...installmentPays].sort((a, b) =>
    a.dueDate.localeCompare(b.dueDate));

  return { billingCycles: sortedCycles, installmentPays: sortedInstallments };
}

export async function getSpendingByCategory(
  year: number,
  month: number): Promise<CategoryBreakdown[]> {
  const data = await unwrap<MonthlyReportEnvelope>(
    apiClient.get(
      `/finance/monthly-periods/${String(year)}/${String(month)}/report`,
    ),
  );

  return data.report.categoryBreakdown.map((row, idx) => {
    const pct =
      typeof row.percentageOfTotalExpense === "number"
        ? Math.round(row.percentageOfTotalExpense * 100) / 100
        : 0;
    const id =
      typeof row.categoryId === "string" && row.categoryId.length > 0
        ? row.categoryId
        : `cat-${idx}-uncategorized`;

    return {
      categoryId: id,
      categoryName: row.categoryName,
      amount: row.amount,
      percentage: pct,
      color: warmPaletteColor(idx),
    };
  });
}

export async function getMonthlyTrend(
  months = 6,
  currency = "VND",
): Promise<MonthlyTrendPoint[]> {
  const envelope = await unwrap<PeriodsEnvelope>(
    apiClient.get("/finance/monthly-periods"));

  const window = envelope.periods.slice(0, months).reverse();

  return window.map((row) => {
    const group = row.currencyGroups?.find(
      (item) => item.currency === currency,
    );
    const legacyMatches =
      row.currency === currency || (row.currency == null && currency === "VND");
    return {
      year: row.year,
      month: row.month,
      income: group?.totalIncome ?? (legacyMatches ? row.totalIncome : 0),
      expense: group?.totalExpense ?? (legacyMatches ? row.totalExpense : 0),
      currency,
    };
  });
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [sources, debts, savings] = await Promise.all([
    getSources(),
    getDebtRecords({ status: "active" }),
    getSavings(),
  ]);
  return computeDashboardMetrics(sources, debts, savings);
}

export async function getCategorySpendingTrendBundle(
  months = 6,
  currency = "VND",
): Promise<CategorySpendingTrendBundle> {
  const [periods, categories] = await Promise.all([
    getMonthlyTrend(months, currency),
    getFlatCategories("expense"),
  ]);

  const reportResults = await Promise.all(
    periods.map(async (p) => {
      try {
        const report = await getMonthlyReport(p.year, p.month);
        const group = report.currencyGroups.find(
          (item) => item.currency === currency,
        );
        const legacyMatches =
          report.metadata?.currency === currency ||
          (report.metadata?.currency == null && currency === "VND");
        return {
          key: `${String(p.year)}-${String(p.month)}`,
          breakdown:
            group?.categoryBreakdown ??
            (legacyMatches ? report.categoryBreakdown : []),
        };
      } catch {
        return {
          key: `${String(p.year)}-${String(p.month)}`,
          breakdown: [] as CategoryBreakdownItem[],
        };
      }
    }),
  );

  const reportsByMonth = new Map(
    reportResults.map((r) => [r.key, r.breakdown]),
  );

  return {
    currency,
    parent: buildCategorySpendingTrend(
      periods,
      reportsByMonth,
      categories,
      "parent",
    ),
    child: buildCategorySpendingTrend(
      periods,
      reportsByMonth,
      categories,
      "child",
    ),
  };
}
