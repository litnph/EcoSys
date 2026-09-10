import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useTranslations } from "@/i18n/hooks";
import { DataTableScrollRegion } from "@/shared/components/ui/DataTableScrollRegion";
import { SkeletonText } from "@/shared/components/ui/Skeleton";
import { formatCurrency, formatPercentage } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";

import type { CategoryBudgetUtilization } from "../types";

type BudgetUtilizationChartProps = {
  items: CategoryBudgetUtilization[] | undefined;
  currency: string;
  isLoading: boolean;
};

type BudgetChartRow = CategoryBudgetUtilization & {
  budget: number;
  spent: number;
};

const compactAmount = new Intl.NumberFormat("vi-VN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function statusClass(status: CategoryBudgetUtilization["status"]): string {
  if (status === "exceeded") return "text-danger";
  if (status === "nearLimit" || status === "reached" || status === "belowTarget") {
    return "text-warning";
  }
  return "text-success";
}

export function BudgetUtilizationChart({
  items,
  currency,
  isLoading,
}: BudgetUtilizationChartProps) {
  const t = useTranslations("reports");

  if (isLoading || items === undefined) {
    return (
      <article className="rounded-card border border-warm-200 bg-surface p-5 shadow-sm">
        <SkeletonText className="h-5 w-56" />
        <SkeletonText className="mt-5 h-64 w-full rounded-lg" />
      </article>
    );
  }

  const rows: BudgetChartRow[] = items
    .map((item) => ({ ...item, budget: item.budgetAmount, spent: item.spentAmount }))
    .sort((left, right) => right.utilizationPercent - left.utilizationPercent);

  return (
    <article className="rounded-card border border-warm-200 bg-surface p-5 shadow-sm">
      <header>
        <h3 className="font-display text-base font-semibold text-warm-900">
          {t("budgetChartTitle")}
        </h3>
        <p className="mt-1 max-w-3xl text-sm text-warm-500">
          {t("budgetChartDescription")}
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="mt-5 flex min-h-52 items-center justify-center rounded-lg border border-dashed border-warm-200 bg-warm-50 px-6 text-center">
          <div>
            <p className="text-sm font-medium text-warm-700">{t("budgetChartEmpty")}</p>
            <p className="mt-1 text-xs text-warm-500">{t("budgetChartEmptyHint")}</p>
          </div>
        </div>
      ) : (
        <>
          <div
            className="mt-5 overflow-x-auto"
            role="img"
            aria-label={t("budgetChartAria", { currency })}
          >
            <div className="min-w-[36rem]" style={{ height: Math.max(280, rows.length * 48) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  accessibilityLayer
                  data={rows}
                  layout="vertical"
                  margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                >
                  <CartesianGrid
                    stroke="var(--color-warm-200)"
                    strokeDasharray="4 8"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tickFormatter={(value: number) => compactAmount.format(value)}
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                  />
                  <YAxis
                    type="category"
                    dataKey="categoryName"
                    width={132}
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      formatCurrency(Number(value ?? 0), currency),
                      name === "spent" ? t("budgetSpent") : t("budgetLimit"),
                    ]}
                    labelFormatter={(label) => String(label)}
                  />
                  <Legend
                    formatter={(value) =>
                      value === "spent" ? t("budgetSpent") : t("budgetLimit")
                    }
                  />
                  <Bar
                    dataKey="budget"
                    fill="var(--color-warm-300)"
                    radius={[0, 4, 4, 0]}
                    isAnimationActive={false}
                  />
                  <Bar
                    dataKey="spent"
                    fill="var(--color-accent)"
                    radius={[0, 4, 4, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <details className="mt-4 text-sm text-warm-600">
            <summary className="cursor-pointer font-medium text-warm-700">
              {t("budgetTableToggle")}
            </summary>
            <DataTableScrollRegion
              label={t("budgetTableAria")}
              className="mt-2 rounded-input border border-warm-200"
            >
              <table className="min-w-full text-left text-sm">
                <thead className="bg-warm-50 text-warm-600">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">{t("budgetCategory")}</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">{t("budgetSpent")}</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">{t("budgetLimit")}</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">{t("budgetUtilization")}</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">{t("budgetStatus")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100">
                  {rows.map((row) => (
                    <tr key={`${row.categoryId}-${row.currency}`}>
                      <th scope="row" className="whitespace-nowrap px-3 py-2 font-medium text-warm-800">
                        {row.categoryName}
                      </th>
                      <td className="whitespace-nowrap px-3 py-2 text-right font-mono tabular-nums">
                        {formatCurrency(row.spentAmount, row.currency)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right font-mono tabular-nums">
                        <span aria-hidden>{row.targetMode === "maximum" ? "≤ " : "≥ "}</span>
                        {formatCurrency(row.budgetAmount, row.currency)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right font-mono tabular-nums">
                        {formatPercentage(row.utilizationPercent)}
                      </td>
                      <td className={cn("whitespace-nowrap px-3 py-2 text-right font-medium", statusClass(row.status))}>
                        {t(`budgetStatusValue.${row.status}`)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataTableScrollRegion>
          </details>
        </>
      )}
    </article>
  );
}
