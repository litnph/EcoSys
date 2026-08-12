import { useEffect, useMemo, useState } from "react";

import { CategoryBreakdown } from "@/features/dashboard/components/CategoryBreakdown";
import { KPICard, KPICardSkeleton } from "@/features/dashboard/components/KPICard";
import { MonthlySavingsCard } from "@/features/dashboard/components/MonthlySavingsCard";
import { ErrorBoundary } from "@/shared/components/feedback/ErrorBoundary";

import type { BillingCycle } from "@/features/billing-cycles/types";

import type { MonthlyReport } from "../types";
import {
  buildFilteredCategoryBreakdown,
  type CategoryExpenseFilter,
} from "../utils/categoryBreakdownFilter";
import { buildReportKpis } from "../utils/buildReportKpis";
import { mapReportCategoriesToChart } from "../utils/mapReportCategories";
import { BillingCyclesReportSection } from "./BillingCyclesReportSection";
import { CloseMonthSection } from "./CloseMonthSection";
import { DirectExpensesSection } from "./DirectExpensesSection";
import { ReportCategoryAllocation } from "./ReportCategoryAllocation";
import { ReportCategorySpendingTrendChart } from "./ReportCategorySpendingTrendChart";
import { ReportRecentTransactions } from "./ReportRecentTransactions";

function ReportSectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="mb-4">
      <h2 className="font-display text-lg font-semibold text-warm-900">
        {title}
      </h2>
      <p className="mt-1 max-w-3xl text-sm text-warm-600">{description}</p>
    </header>
  );
}

export type MonthlyReportDetailViewProps = {
  report: MonthlyReport | undefined;
  isLoading: boolean;
  year: number;
  month: number;
  billingCycles: BillingCycle[] | undefined;
  isCyclesLoading?: boolean;
  onClosed?: () => void;
};

export function MonthlyReportDetailView({
  report,
  isLoading,
  year,
  month,
  billingCycles,
  isCyclesLoading,
  onClosed,
}: MonthlyReportDetailViewProps) {
  const [expenseFilter, setExpenseFilter] =
    useState<CategoryExpenseFilter>("transactions");
  const defaultCurrency =
    report?.metadata?.currency ?? report?.currencyGroups[0]?.currency ?? "";
  const [selectedCurrency, setSelectedCurrency] = useState(defaultCurrency);

  useEffect(() => {
    setSelectedCurrency(defaultCurrency);
  }, [defaultCurrency, month, year]);

  const activeReport = useMemo<MonthlyReport | undefined>(() => {
    if (!report || report.currencyGroups.length === 0) return report;
    const group =
      report.currencyGroups.find((item) => item.currency === selectedCurrency) ??
      report.currencyGroups[0];
    if (!group) return report;
    return {
      ...report,
      totalIncome: group.totalIncome,
      totalExpense: group.totalExpense,
      net: group.net,
      savingsRate: group.savingsRate,
      categoryBreakdown: group.categoryBreakdown,
      sourceBreakdown: group.sourceBreakdown,
      dailyBreakdown: group.dailyBreakdown,
      comparisonWithPrevious: group.comparisonWithPrevious,
      directExpenses: group.directExpenses,
      billingCycles: group.billingCycles,
      metadata: report.metadata
        ? { ...report.metadata, currency: group.currency }
        : null,
    };
  }, [report, selectedCurrency]);

  const kpis = useMemo(
    () => (activeReport ? buildReportKpis(activeReport) : undefined),
    [activeReport],
  );

  const breakdownCategories = useMemo(() => {
    if (!activeReport) return undefined;
    return mapReportCategoriesToChart(
      buildFilteredCategoryBreakdown(activeReport, expenseFilter),
    );
  }, [activeReport, expenseFilter]);

  const periodHint =
    activeReport !== undefined
      ? `Tháng ${String(activeReport.month).padStart(2, "0")}/${String(activeReport.year)}`
      : undefined;

  return (
    <div className="flex flex-col gap-8">
      {activeReport?.metadata ? (
        <aside
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warm-200 bg-warm-50 px-4 py-3 text-xs text-warm-600"
          aria-label="Cơ sở tính báo cáo"
        >
          <span>
            <span className="font-semibold text-warm-800">Cơ sở báo cáo:</span>{" "}
            {activeReport.metadata.currency ?? "Không có dữ liệu tiền tệ"} ·{" "}
            {activeReport.metadata.timeZone} · {activeReport.metadata.formulaVersion}
          </span>
          {report && report.currencyGroups.length > 1 ? (
            <label className="inline-flex items-center gap-2 font-medium text-warm-700">
              Tiền tệ
              <select
                className="min-h-9 rounded-md border border-warm-300 bg-surface px-2 text-sm text-warm-900"
                value={selectedCurrency}
                onChange={(event) => setSelectedCurrency(event.target.value)}
              >
                {report.currencyGroups.map((group) => (
                  <option key={group.currency} value={group.currency}>
                    {group.currency}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </aside>
      ) : null}

      <section
        aria-label="Chỉ số tháng"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {isLoading || kpis === undefined
          ? Array.from({ length: 4 }, (_, i) => (
              <KPICardSkeleton key={String(i)} />
            ))
          : kpis.map((metric) => (
              <KPICard key={metric.id} metric={metric} />
            ))}
      </section>

      <section aria-label="Phân bổ chi tiêu">
        <ErrorBoundary fallbackTitle="Không tải được phân bổ chi tiêu">
          <ReportCategoryAllocation
            report={activeReport}
            isLoading={isLoading}
            filter={expenseFilter}
            onFilterChange={setExpenseFilter}
          />
        </ErrorBoundary>
      </section>

      <section aria-label="Xu hướng chi theo danh mục">
        <ErrorBoundary fallbackTitle="Không tải được xu hướng chi theo danh mục">
          <ReportCategorySpendingTrendChart
            report={activeReport}
            isLoading={isLoading}
            expenseFilter={expenseFilter}
          />
        </ErrorBoundary>
      </section>

      <section
        aria-label="Tóm tắt"
        className="grid grid-cols-1 gap-6 md:grid-cols-3"
      >
        <ErrorBoundary fallbackTitle="Không tải được giao dịch">
          <ReportRecentTransactions
            report={activeReport}
            isLoading={isLoading}
            year={year}
            month={month}
          />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="Không tải được danh mục">
          <CategoryBreakdown
            data={breakdownCategories}
            isLoading={isLoading}
            currency={activeReport?.metadata?.currency ?? "VND"}
          />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="Không tải được tiết kiệm">
          <MonthlySavingsCard
            isLoading={isLoading || activeReport === undefined}
            savingsRate={activeReport?.savingsRate ?? null}
            savedAmount={
              activeReport !== undefined
                ? activeReport.totalIncome - activeReport.totalExpense
                : 0
            }
            incomeAmount={activeReport?.totalIncome ?? 0}
            currency={activeReport?.metadata?.currency ?? "VND"}
            periodHint={periodHint}
          />
        </ErrorBoundary>
      </section>

      <section>
        <ReportSectionHeading
          title="Xem chi tiết chi tiêu"
          description="Chi trả trực tiếp từ nguồn tiền và chi phát sinh qua kỳ sao kê thẻ trong tháng báo cáo."
        />
        <div className="grid gap-6 xl:grid-cols-2">
          <DirectExpensesSection
            section={activeReport?.directExpenses}
            isLoading={isLoading}
          />
          <BillingCyclesReportSection
            section={activeReport?.billingCycles}
            isLoading={isLoading}
          />
        </div>
      </section>

      {activeReport ? (
        <section>
          <ReportSectionHeading
            title="Hoàn tất báo cáo"
            description="Chốt báo cáo khi đã kiểm tra số liệu và xử lý xong các kỳ sao kê thẻ trong tháng."
          />
          <CloseMonthSection
            year={year}
            month={month}
            status={activeReport.status}
            billingCycles={billingCycles}
            isCyclesLoading={isCyclesLoading}
            onClosed={onClosed}
          />
        </section>
      ) : null}
    </div>
  );
}
