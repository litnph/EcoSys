import { useMemo, useState } from "react";

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

  const kpis = useMemo(
    () => (report ? buildReportKpis(report) : undefined),
    [report],
  );

  const breakdownCategories = useMemo(() => {
    if (!report) return undefined;
    return mapReportCategoriesToChart(
      buildFilteredCategoryBreakdown(report, expenseFilter),
    );
  }, [report, expenseFilter]);

  const periodHint =
    report !== undefined
      ? `Tháng ${String(report.month).padStart(2, "0")}/${String(report.year)}`
      : undefined;

  return (
    <div className="flex flex-col gap-8">
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
            report={report}
            isLoading={isLoading}
            filter={expenseFilter}
            onFilterChange={setExpenseFilter}
          />
        </ErrorBoundary>
      </section>

      <section
        aria-label="Tóm tắt"
        className="grid grid-cols-1 gap-6 md:grid-cols-3"
      >
        <ErrorBoundary fallbackTitle="Không tải được giao dịch">
          <ReportRecentTransactions
            report={report}
            isLoading={isLoading}
            year={year}
            month={month}
          />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="Không tải được danh mục">
          <CategoryBreakdown
            data={breakdownCategories}
            isLoading={isLoading}
          />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="Không tải được tiết kiệm">
          <MonthlySavingsCard
            isLoading={isLoading || report === undefined}
            savingsRate={report?.savingsRate ?? null}
            savedAmount={
              report !== undefined
                ? report.totalIncome - report.totalExpense
                : 0
            }
            incomeAmount={report?.totalIncome ?? 0}
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
            section={report?.directExpenses}
            isLoading={isLoading}
          />
          <BillingCyclesReportSection
            section={report?.billingCycles}
            isLoading={isLoading}
          />
        </div>
      </section>

      {report ? (
        <section>
          <ReportSectionHeading
            title="Hoàn tất báo cáo"
            description="Chốt báo cáo khi đã kiểm tra số liệu và xử lý xong các kỳ sao kê thẻ trong tháng."
          />
          <CloseMonthSection
            year={year}
            month={month}
            status={report.status}
            billingCycles={billingCycles}
            isCyclesLoading={isCyclesLoading}
            onClosed={onClosed}
          />
        </section>
      ) : null}
    </div>
  );
}
