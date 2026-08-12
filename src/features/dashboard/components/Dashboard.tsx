import { useEffect, useMemo, useState } from "react";

import { useTranslations } from "@/i18n/hooks";

import { ErrorBoundary } from "@/shared/components/feedback/ErrorBoundary";
import { PageHeader } from "@/shared/components/layouts/PageHeader";
import { AsyncStateError } from "@/shared/components/ui/AsyncStateError";

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
  const [selectedCurrency, setSelectedCurrency] = useState("VND");

  const metricsQ = useDashboardMetrics();
  const trendQ = useMonthlyTrend(6, selectedCurrency);
  const categoryTrendQ = useCategorySpendingTrend(6, selectedCurrency);
  const currencyGroups = useMemo(
    () => metricsQ.data?.currencyGroups ?? [],
    [metricsQ.data?.currencyGroups],
  );

  useEffect(() => {
    if (currencyGroups.length === 0) return;
    if (currencyGroups.some((group) => group.currency === selectedCurrency)) return;
    setSelectedCurrency(
      currencyGroups.find((group) => group.currency === "VND")?.currency ??
        currencyGroups[0]?.currency ??
        "VND",
    );
  }, [currencyGroups, selectedCurrency]);

  const selectedMetrics = currencyGroups.find(
    (group) => group.currency === selectedCurrency,
  );

  const kpis = useMemo(
    () =>
      selectedMetrics !== undefined
        ? buildDashboardMetricsKpis(selectedMetrics)
        : undefined,
    [selectedMetrics],
  );

  const kpiLoading = metricsQ.isLoading || kpis === undefined;

  return (
    <div className="w-full font-sans">
      <PageHeader title={t("title")} description={t("description")} />

      {currencyGroups.length > 1 ? (
        <div className="mb-4 flex justify-end">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-warm-700">
            Tiền tệ
            <select
              className="min-h-10 rounded-md border border-warm-300 bg-surface px-3 text-warm-900"
              value={selectedCurrency}
              onChange={(event) => setSelectedCurrency(event.target.value)}
            >
              {currencyGroups.map((group) => (
                <option key={group.currency} value={group.currency}>
                  {group.currency}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {metricsQ.isError ? (
        <AsyncStateError
          title="Không tải được chỉ số tài chính"
          onRetry={() => void metricsQ.refetch()}
        />
      ) : (
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
      )}

      <section aria-label="Thu chi" className="mt-6">
        <ErrorBoundary fallbackTitle="Không tải được xu hướng thu chi">
          {trendQ.isError ? (
            <AsyncStateError
              title="Không tải được xu hướng thu chi"
              onRetry={() => void trendQ.refetch()}
            />
          ) : (
            <SpendingChart data={trendQ.data} isLoading={trendQ.isLoading} />
          )}
        </ErrorBoundary>
      </section>

      <section aria-label="Chi theo danh mục" className="mt-6">
        <ErrorBoundary fallbackTitle="Không tải được chi theo danh mục">
          {categoryTrendQ.isError ? (
            <AsyncStateError
              title="Không tải được chi theo danh mục"
              onRetry={() => void categoryTrendQ.refetch()}
            />
          ) : (
            <CategorySpendingTrendChart
              bundle={categoryTrendQ.data}
              isLoading={categoryTrendQ.isLoading}
              level={categoryLevel}
              onLevelChange={setCategoryLevel}
            />
          )}
        </ErrorBoundary>
      </section>
    </div>
  );
}
