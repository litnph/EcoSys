"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";

import { PageHeader } from "@/shared/components/layouts/PageHeader";
import { ErrorBoundary } from "@/shared/components/feedback/ErrorBoundary";
import { SkeletonText } from "@/shared/components/ui/Skeleton";
import { staggerChildren } from "@/shared/lib/animations";

import { MissingFinanceModule } from "@/shared/components/finance/MissingFinanceModule";
import { useFinanceSmoduleId } from "@/shared/hooks/useFinanceSmoduleId";

import {
  useDashboardSources,
  useDashboardSummary,
  useMonthlyTrend,
  useRecentTransactions,
  useSpendingByCategory,
  useUpcomingDues,
} from "../hooks";
import { MonthlySummaryCard } from "./MonthlySummaryCard";
import { NetWorthCard } from "./NetWorthCard";
import { RecentTransactionsCard } from "./RecentTransactionsCard";
import { SourcesOverviewCard } from "./SourcesOverviewCard";
import { UpcomingDuesCard } from "./UpcomingDuesCard";

const SpendingPieChart = dynamic(
  () => import("./SpendingPieChart").then((m) => m.SpendingPieChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[260px] items-center justify-center rounded-card border border-warm-200 bg-surface p-6 shadow-sm">
        <SkeletonText className="h-52 w-full rounded-lg" />
      </div>
    ),
  },
);

const MonthlyTrendChart = dynamic(
  () => import("./MonthlyTrendChart").then((m) => m.MonthlyTrendChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[300px] items-center justify-center rounded-card border border-warm-200 bg-surface p-6 shadow-sm">
        <SkeletonText className="h-56 w-full rounded-lg" />
      </div>
    ),
  },
);

export function DashboardOverview() {
  const t = useTranslations("dashboard");
  const moduleIdRaw = useFinanceSmoduleId();

  const { year: reportYear, month: reportMonth } = useMemo(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }, []);

  const summaryQ = useDashboardSummary(
    moduleIdRaw.length ? moduleIdRaw : undefined,
  );
  const sourcesQ = useDashboardSources(
    moduleIdRaw.length ? moduleIdRaw : undefined,
  );
  const txsQ = useRecentTransactions(
    moduleIdRaw.length ? moduleIdRaw : undefined,
  );
  const duesQ = useUpcomingDues(
    moduleIdRaw.length ? moduleIdRaw : undefined,
  );
  const categoriesQ = useSpendingByCategory(
    moduleIdRaw.length ? moduleIdRaw : undefined,
    reportYear,
    reportMonth,
  );
  const trendQ = useMonthlyTrend(
    moduleIdRaw.length ? moduleIdRaw : undefined,
  );

  const missingModule = moduleIdRaw.length === 0;

  return (
    <div className="w-full max-w-[1400px]">
      <PageHeader title={t("title")} description={t("description")} />
      {missingModule ? (
        <MissingFinanceModule />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={moduleIdRaw}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              variants={staggerChildren}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 gap-4 md:auto-rows-fr md:grid-cols-2 md:gap-6 xl:grid-cols-3"
            >
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
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
