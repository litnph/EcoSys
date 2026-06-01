import { useMemo } from "react";

import { useTranslations } from "@/i18n/hooks";

import { PageHeader } from "@/shared/components/layouts/PageHeader";
import { ErrorBoundary } from "@/shared/components/feedback/ErrorBoundary";

import {
  useDashboardSources,
  useDashboardSummary,
  useMonthlyTrend,
  useRecentTransactions,
  useSpendingByCategory,
  useUpcomingDues,
} from "../hooks";
import { MonthlySummaryCard } from "./MonthlySummaryCard";
import { MonthlyTrendChart } from "./MonthlyTrendChart";
import { NetWorthCard } from "./NetWorthCard";
import { RecentTransactionsCard } from "./RecentTransactionsCard";
import { SourcesOverviewCard } from "./SourcesOverviewCard";
import { SpendingPieChart } from "./SpendingPieChart";
import { UpcomingDuesCard } from "./UpcomingDuesCard";

export function DashboardOverview() {
  const t = useTranslations("dashboard");
  const { year: reportYear, month: reportMonth } = useMemo(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }, []);

  const summaryQ = useDashboardSummary();
  const sourcesQ = useDashboardSources();
  const txsQ = useRecentTransactions();
  const duesQ = useUpcomingDues();
  const categoriesQ = useSpendingByCategory(reportYear, reportMonth);
  const trendQ = useMonthlyTrend();

  return (
    <div className="w-full">
      <PageHeader title={t("title")} description={t("description")} />
      <div className="grid grid-cols-1 gap-4 md:auto-rows-fr md:grid-cols-2 md:gap-6 xl:grid-cols-3">
              <ErrorBoundary fallbackTitle="Không tải được tài sản ròng">
                <div className="md:col-span-2 xl:col-span-2">
                  <NetWorthCard
                    summary={summaryQ.data}
                    isLoading={summaryQ.isLoading}
                  />
                </div>
              </ErrorBoundary>
              <ErrorBoundary fallbackTitle="Không tải được bản tóm tắt tháng">
                <div className="md:col-span-2 xl:col-span-1 md:mx-auto xl:mx-0 w-full md:max-w-lg xl:max-w-none">
                  <MonthlySummaryCard
                    summary={summaryQ.data}
                    isLoading={summaryQ.isLoading}
                  />
                </div>
              </ErrorBoundary>

              <ErrorBoundary fallbackTitle="Không tải được nguồn tài chính">
                <div className="md:col-span-1 xl:col-span-1">
                  <SourcesOverviewCard
                    sources={sourcesQ.data}
                    isLoading={sourcesQ.isLoading}
                  />
                </div>
              </ErrorBoundary>
              <ErrorBoundary fallbackTitle="Không tải được đến hạn">
                <div className="md:col-span-1 xl:col-span-2">
                  <UpcomingDuesCard
                    billingCycles={duesQ.data?.billingCycles}
                    installments={duesQ.data?.installmentPays}
                    isLoading={duesQ.isLoading}
                  />
                </div>
              </ErrorBoundary>

              <ErrorBoundary fallbackTitle="Không tải được biểu đồ chi tiêu">
                <div className="xl:col-span-1 md:col-span-2 xl:col-span-1">
                  <SpendingPieChart
                    data={categoriesQ.data}
                    isLoading={categoriesQ.isLoading}
                  />
                </div>
              </ErrorBoundary>
              <ErrorBoundary fallbackTitle="Không tải được xu hướng tháng">
                <div className="md:col-span-2 xl:col-span-2">
                  <MonthlyTrendChart
                    data={trendQ.data}
                    isLoading={trendQ.isLoading}
                  />
                </div>
              </ErrorBoundary>

              <ErrorBoundary fallbackTitle="Không tải được giao dịch gần đây">
                <div className="col-span-1 md:col-span-2 xl:col-span-3">
                  <RecentTransactionsCard
                    items={txsQ.data}
                    isLoading={txsQ.isLoading}
                  />
                </div>
              </ErrorBoundary>
      </div>
    </div>
  );
}
