import { useEffect, useMemo, useState } from "react";

import { CategoryBreakdown } from "@/features/dashboard/components/CategoryBreakdown";
import { KPICard, KPICardSkeleton } from "@/features/dashboard/components/KPICard";
import { useTranslations } from "@/i18n/hooks";
import { ErrorBoundary } from "@/shared/components/feedback/ErrorBoundary";

import type { BillingCycle } from "@/features/billing-cycles/types";

import type { MonthlyReport } from "../types";
import {
  buildFilteredCategoryBreakdown,
  type CategoryExpenseFilter,
} from "../utils/categoryBreakdownFilter";
import { buildReportKpis } from "../utils/buildReportKpis";
import { mapReportCategoriesToChart } from "../utils/mapReportCategories";
import {
  defaultMonthlyReportFilters,
  filterMonthlyReport,
} from "../utils/filterMonthlyReport";
import { BillingCyclesReportSection } from "./BillingCyclesReportSection";
import { BudgetUtilizationChart } from "./BudgetUtilizationChart";
import { CloseMonthSection } from "./CloseMonthSection";
import { DirectExpensesSection } from "./DirectExpensesSection";
import { MonthlyReportFilters } from "./MonthlyReportFilters";
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
  const t = useTranslations("reports");
  const [expenseFilter, setExpenseFilter] =
    useState<CategoryExpenseFilter>("transactions");
  const [reportFilters, setReportFilters] = useState(() =>
    defaultMonthlyReportFilters(),
  );
  const defaultCurrency =
    report?.metadata?.currency ?? report?.currencyGroups[0]?.currency ?? "";
  const [selectedCurrency, setSelectedCurrency] = useState(defaultCurrency);

  useEffect(() => {
    setSelectedCurrency(defaultCurrency);
  }, [defaultCurrency, month, year]);

  useEffect(() => {
    setReportFilters(defaultMonthlyReportFilters());
  }, [month, selectedCurrency, year]);

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
      budgetUtilizations: group.budgetUtilizations,
      metadata: report.metadata
        ? { ...report.metadata, currency: group.currency }
        : null,
    };
  }, [report, selectedCurrency]);

  const filteredReport = useMemo(
    () =>
      activeReport
        ? filterMonthlyReport(activeReport, reportFilters)
        : undefined,
    [activeReport, reportFilters],
  );

  const kpis = useMemo(
    () => (filteredReport ? buildReportKpis(filteredReport) : undefined),
    [filteredReport],
  );

  const breakdownCategories = useMemo(() => {
    if (!filteredReport) return undefined;
    return mapReportCategoriesToChart(
      buildFilteredCategoryBreakdown(filteredReport, expenseFilter),
    );
  }, [filteredReport, expenseFilter]);

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
          {activeReport.metadata.reportingPeriodStart && activeReport.metadata.reportingPeriodEnd ? (
            <span className="font-medium text-warm-700">
              {t("reportPeriod", {
                start: activeReport.metadata.reportingPeriodStart,
                end: activeReport.metadata.reportingPeriodEnd,
              })}
            </span>
          ) : null}
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

      <MonthlyReportFilters
        sources={activeReport?.sourceBreakdown ?? []}
        value={reportFilters}
        onChange={setReportFilters}
      />

      <section
        aria-label="Chỉ số tháng"
        className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-warm-200 bg-warm-200 xl:grid-cols-3"
      >
        {isLoading || kpis === undefined
          ? Array.from({ length: 3 }, (_, i) => (
              <KPICardSkeleton key={String(i)} />
            ))
          : kpis.map((metric) => (
              <KPICard key={metric.id} metric={metric} />
            ))}
      </section>

      <div className="report-workbench">
      <section aria-label="Phân bổ chi tiêu">
        <ErrorBoundary fallbackTitle="Không tải được phân bổ chi tiêu">
          <ReportCategoryAllocation
            report={filteredReport}
            isLoading={isLoading}
            filter={expenseFilter}
            onFilterChange={setExpenseFilter}
          />
        </ErrorBoundary>
      </section>

      <section aria-label={t("budgetChartTitle")}>
        <ErrorBoundary fallbackTitle={t("budgetChartError")}>
          <BudgetUtilizationChart
            items={activeReport?.budgetUtilizations}
            currency={activeReport?.metadata?.currency ?? "VND"}
            isLoading={isLoading}
          />
        </ErrorBoundary>
      </section>

      <section aria-label={t("spendingTrendAria")}>
        <ErrorBoundary fallbackTitle={t("spendingTrendError")}>
          <ReportCategorySpendingTrendChart
            report={filteredReport}
            isLoading={isLoading}
            expenseFilter={expenseFilter}
          />
        </ErrorBoundary>
      </section>

      <section
        aria-label="Tóm tắt"
        className="grid grid-cols-1 gap-6 md:grid-cols-2"
      >
        <ErrorBoundary fallbackTitle="Không tải được giao dịch">
          <ReportRecentTransactions
            report={filteredReport}
            isLoading={isLoading}
            year={year}
            month={month}
          />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="Không tải được danh mục">
          <CategoryBreakdown
            data={breakdownCategories}
            isLoading={isLoading}
            currency={filteredReport?.metadata?.currency ?? "VND"}
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
            section={filteredReport?.directExpenses}
            isLoading={isLoading}
          />
          <BillingCyclesReportSection
            section={filteredReport?.billingCycles}
            isLoading={isLoading}
          />
        </div>
      </section>
      </div>

      {filteredReport ? (
        <section>
          <ReportSectionHeading
            title="Hoàn tất báo cáo"
            description="Chốt báo cáo khi đã kiểm tra số liệu và xử lý xong các kỳ sao kê thẻ trong tháng."
          />
          <CloseMonthSection
            year={year}
            month={month}
            status={filteredReport.status}
            billingCycles={billingCycles}
            isCyclesLoading={isCyclesLoading}
            onClosed={onClosed}
          />
        </section>
      ) : null}
    </div>
  );
}
