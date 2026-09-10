import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useFlatCategories } from "@/features/categories/hooks/useFlatCategories";
import type { CategoryRollupLevel, CategorySpendingTrend } from "@/features/dashboard/types";
import { Button } from "@/shared/components/ui/Button";
import { SkeletonText } from "@/shared/components/ui/Skeleton";
import { AsyncStateError } from "@/shared/components/ui/AsyncStateError";
import { DataTableScrollRegion } from "@/shared/components/ui/DataTableScrollRegion";
import { formatCompactNumber, formatCurrency } from "@/shared/lib/formatters";

import type { MonthlyReport } from "../types";
import type { CategoryExpenseFilter } from "../utils/categoryBreakdownFilter";
import {
  buildReportCategorySpendingTrend,
  type ReportTrendGroupBy,
} from "../utils/buildReportCategorySpendingTrend";

const LEVEL_OPTIONS: { value: CategoryRollupLevel; label: string }[] = [
  { value: "parent", label: "Danh mục cha" },
  { value: "child", label: "Danh mục con" },
];

const GROUP_OPTIONS: { value: ReportTrendGroupBy; label: string }[] = [
  { value: "day", label: "Theo ngày" },
  { value: "week", label: "Theo tuần" },
];

type ReportCategorySpendingTrendChartProps = {
  report: MonthlyReport | undefined;
  isLoading: boolean;
  expenseFilter: CategoryExpenseFilter;
};

type ChartRow = Record<string, number | string>;

type TrendTooltipProps = {
  active?: boolean;
  payload?: ReadonlyArray<{ name: string; value: number; color: string }>;
  label?: string;
  currency: string;
};

function TrendTooltip({ active, payload, label, currency }: TrendTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-warm-200 bg-surface px-3 py-2 shadow-md">
      <p className="mb-1.5 text-xs font-medium text-warm-500">{label}</p>
      {payload.map((entry) => (
        <p
          key={entry.name}
          className="font-mono text-sm"
          style={{ color: entry.color }}
        >
          {entry.name} · {formatCurrency(entry.value, currency)}
        </p>
      ))}
    </div>
  );
}

function toChartRows(trend: CategorySpendingTrend): ChartRow[] {
  return trend.months.map((month, idx) => {
    const row: ChartRow = { label: month.label };
    for (const s of trend.series) {
      row[s.key] = s.amounts[idx] ?? 0;
    }
    return row;
  });
}

function emptyMessage(filter: CategoryExpenseFilter): string {
  if (filter === "installments") {
    return "Không có chi trả góp theo danh mục trong tháng";
  }
  if (filter === "transactions") {
    return "Không có giao dịch chi theo danh mục trong tháng";
  }
  return "Không có dữ liệu chi theo danh mục trong tháng";
}

export function ReportCategorySpendingTrendChart({
  report,
  isLoading,
  expenseFilter,
}: ReportCategorySpendingTrendChartProps) {
  const [level, setLevel] = useState<CategoryRollupLevel>("parent");
  const [groupBy, setGroupBy] = useState<ReportTrendGroupBy>("day");
  const [hiddenSeriesKeys, setHiddenSeriesKeys] = useState<Set<string>>(
    () => new Set(),
  );

  const categoriesQ = useFlatCategories("expense");

  const trend = useMemo(() => {
    if (!report || !categoriesQ.data) return undefined;
    return buildReportCategorySpendingTrend(
      report,
      expenseFilter,
      groupBy,
      categoriesQ.data,
      level,
    );
  }, [report, expenseFilter, groupBy, categoriesQ.data, level]);

  const chartRows = useMemo(
    () => (trend ? toChartRows(trend) : []),
    [trend],
  );
  const visibleSeries = useMemo(
    () =>
      trend?.series.filter((series) => !hiddenSeriesKeys.has(series.key)) ?? [],
    [hiddenSeriesKeys, trend],
  );

  useEffect(() => {
    setHiddenSeriesKeys(new Set());
  }, [level, report?.metadata?.currency, report?.month, report?.year]);

  const chartLoading =
    isLoading || report === undefined || categoriesQ.isLoading;

  if (chartLoading) {
    return (
      <article className="flex min-h-[360px] flex-col rounded-lg border border-warm-200 bg-surface p-5 shadow-sm">
        <SkeletonText className="mb-4 h-5 w-56" />
        <SkeletonText className="min-h-[300px] flex-1 rounded-lg" />
      </article>
    );
  }

  if (categoriesQ.isError) {
    return (
      <AsyncStateError
        title="Không tải được danh mục cho biểu đồ"
        description="Vui lòng thử lại để dựng xu hướng từ dữ liệu báo cáo."
        onRetry={() => void categoriesQ.refetch()}
      />
    );
  }

  const empty =
    !trend ||
    trend.series.length === 0 ||
    chartRows.every((row) =>
      trend.series.every((s) => (row[s.key] as number) <= 0),
    );

  const monthLabel = `Tháng ${String(report.month).padStart(2, "0")}/${String(report.year)}`;
  const firstDate = trend?.months[0]?.date;
  const lastDate = trend?.months.at(-1)?.endDate;
  const reportMonthStart = `${String(report.year).padStart(4, "0")}-${String(report.month).padStart(2, "0")}-01`;
  const formatRangeDate = (value: string) => {
    const [rangeYear, rangeMonth, rangeDay] = value.split("-");
    return `${rangeDay}/${rangeMonth}/${rangeYear}`;
  };
  const includesEarlierCardTransactions =
    Boolean(firstDate) && firstDate! < reportMonthStart;
  const periodLabel =
    includesEarlierCardTransactions && firstDate && lastDate
      ? `${formatRangeDate(firstDate)}–${formatRangeDate(lastDate)}`
      : monthLabel;

  return (
    <article className="flex min-h-[360px] flex-col rounded-lg border border-warm-200 bg-surface p-5 shadow-sm">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold text-warm-900">
            Chi tiêu theo danh mục — trong tháng
          </h3>
          <p className="mt-1 text-sm text-warm-500">
            {periodLabel} · Xu hướng chi theo{" "}
            {level === "parent" ? "nhóm danh mục cha" : "danh mục con"}
            {groupBy === "day" ? " · theo ngày" : " · theo tuần"}
            {includesEarlierCardTransactions
              ? " · đã mở rộng theo ngày giao dịch thẻ thuộc kỳ sao kê"
              : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-1 rounded-lg border border-warm-200 bg-warm-50/80 p-1">
            {GROUP_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                type="button"
                variant={groupBy === opt.value ? "primary" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => setGroupBy(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 rounded-lg border border-warm-200 bg-warm-50/80 p-1">
            {LEVEL_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                type="button"
                variant={level === opt.value ? "primary" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => setLevel(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
      </header>

      {!empty && trend ? (
        <fieldset className="mb-4 flex max-h-28 flex-wrap gap-2 overflow-y-auto rounded-lg border border-warm-200 bg-warm-50/60 p-2.5">
          <legend className="sr-only">Danh mục hiển thị trên biểu đồ</legend>
          {trend.series.map((series) => {
            const checked = !hiddenSeriesKeys.has(series.key);
            return (
              <label
                key={series.key}
                className="inline-flex min-h-8 cursor-pointer items-center gap-2 rounded-md border border-warm-200 bg-surface px-2.5 text-xs font-medium text-warm-700 transition hover:border-warm-300"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => {
                    setHiddenSeriesKeys((current) => {
                      const next = new Set(current);
                      if (event.target.checked) next.delete(series.key);
                      else next.add(series.key);
                      return next;
                    });
                  }}
                  className="size-4 rounded border-warm-300 accent-accent"
                />
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: series.color }}
                  aria-hidden
                />
                <span className={checked ? undefined : "text-warm-400 line-through"}>
                  {series.name}
                </span>
              </label>
            );
          })}
        </fieldset>
      ) : null}

      {empty ? (
        <p className="flex flex-1 items-center justify-center text-sm text-warm-400">
          {emptyMessage(expenseFilter)}
        </p>
      ) : visibleSeries.length === 0 ? (
        <p className="flex min-h-[300px] flex-1 items-center justify-center text-sm text-warm-400">
          Chọn ít nhất một danh mục để hiển thị biểu đồ.
        </p>
      ) : (
        <>
        <div
          className="min-h-0 flex-1"
          role="img"
          aria-label={`Biểu đồ xu hướng chi theo danh mục trong ${periodLabel}, đơn vị VND`}
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              accessibilityLayer
              data={chartRows}
              margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
            >
              <CartesianGrid
                stroke="var(--color-warm-200)"
                strokeDasharray="4 8"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                stroke="var(--color-warm-400)"
                fontSize={groupBy === "day" ? 10 : 11}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                interval={groupBy === "day" ? "preserveStartEnd" : 0}
                minTickGap={groupBy === "day" ? 4 : 8}
              />
              <YAxis
                stroke="var(--color-warm-400)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCompactNumber}
                width={56}
              />
              <Tooltip content={<TrendTooltip currency={report?.metadata?.currency ?? "VND"} />} />
              {visibleSeries.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={{ r: 3, fill: s.color, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <details className="mt-3 text-sm text-warm-600">
          <summary className="cursor-pointer font-medium text-warm-700">
            Xem dữ liệu biểu đồ
          </summary>
          <DataTableScrollRegion
            label={`Dữ liệu xu hướng chi theo danh mục trong ${periodLabel}`}
            className="mt-2 rounded-input border border-warm-200"
          >
            <table className="min-w-full text-left text-sm">
              <caption className="sr-only">
                Dữ liệu xu hướng chi theo danh mục trong {periodLabel}
              </caption>
              <thead className="bg-warm-50 text-warm-600">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">Mốc thời gian</th>
                  {visibleSeries.map((series) => (
                    <th
                      key={series.key}
                      scope="col"
                      className="px-3 py-2 text-right font-medium"
                    >
                      {series.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {chartRows.map((row) => (
                  <tr key={String(row.label)}>
                    <td className="whitespace-nowrap px-3 py-2">{row.label}</td>
                    {visibleSeries.map((series) => (
                      <td
                        key={series.key}
                        className="whitespace-nowrap px-3 py-2 text-right font-mono tabular-nums"
                      >
                        {formatCurrency(
                          Number(row[series.key] ?? 0),
                          report?.metadata?.currency ?? "VND",
                        )}
                      </td>
                    ))}
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
