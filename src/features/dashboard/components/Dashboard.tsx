import { useMemo, useState } from "react";

import { useTranslations } from "@/i18n/hooks";

import { ErrorBoundary } from "@/shared/components/feedback/ErrorBoundary";
import { PageHeader } from "@/shared/components/layouts/PageHeader";

import {
  useCategorySpendingTrend,
  useDashboardMetrics,
  useMonthlyTrend,
} from "../hooks";
import type { CategoryRollupLevel } from "../types";
import { buildDashboardMetricsKpis } from "../utils/buildDashboardMetricsKpis";
import { CategorySpendingTrendChart } from "./CategorySpendingTrendChart";
import { KPICard, KPICardSkeleton } from "./KPICard";
import { SpendingChart } from "./SpendingChart";

export function Dashboard() {
  const t = useTranslations("dashboard");
  const [categoryLevel, setCategoryLevel] =
    useState<CategoryRollupLevel>("parent");

  const metricsQ = useDashboardMetrics();
  const trendQ = useMonthlyTrend();
  const categoryTrendQ = useCategorySpendingTrend(6);

  const kpis = useMemo(
    () =>
      metricsQ.data !== undefined
        ? buildDashboardMetricsKpis(metricsQ.data)
        : undefined,
    [metricsQ.data],
  );

  const kpiLoading = metricsQ.isLoading || kpis === undefined;

  return (
    <div className="w-full font-sans">
      <PageHeader title={t("title")} description={t("description")} />

      <section
        aria-label="Chỉ số tài chính"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6"
      >
        {kpiLoading
          ? Array.from({ length: 6 }, (_, i) => (
              <KPICardSkeleton key={String(i)} />
            ))
          : kpis.map((metric) => (
              <KPICard key={metric.id} metric={metric} />
            ))}
      </section>

      <section aria-label="Thu chi" className="mt-6">
        <ErrorBoundary fallbackTitle="Không tải được xu hướng thu chi">
          <SpendingChart data={trendQ.data} isLoading={trendQ.isLoading} />
        </ErrorBoundary>
      </section>

      <section aria-label="Chi theo danh mục" className="mt-6">
        <ErrorBoundary fallbackTitle="Không tải được chi theo danh mục">
          <CategorySpendingTrendChart
            bundle={categoryTrendQ.data}
            isLoading={categoryTrendQ.isLoading}
            level={categoryLevel}
            onLevelChange={setCategoryLevel}
          />
        </ErrorBoundary>
      </section>
    </div>
  );
}
