import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { SkeletonText } from "@/shared/components/ui/Skeleton";
import { formatCurrency, formatPercentage } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";

import type { CategoryBreakdown } from "../types";

type SliceRow = CategoryBreakdown & { value: number };

type CategoryChartProps = {
  data: CategoryBreakdown[] | undefined;
  isLoading: boolean;
  /** Omit outer card + title (e.g. report page with custom header). */
  embedded?: boolean;
  emptyMessage?: string;
  currency?: string;
};

type CategoryTooltipProps = {
  active?: boolean;
  payload?: ReadonlyArray<{ payload: SliceRow }>;
  currency: string;
};

function CategoryTooltip({ active, payload, currency }: CategoryTooltipProps) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;

  return (
    <div className="rounded-lg border border-warm-200 bg-surface px-3 py-2 shadow-md">
      <p className="text-sm font-medium text-warm-900">{row.categoryName}</p>
      <p className="font-mono text-sm text-accent">
        {formatCurrency(row.amount, currency)}{" "}
        <span className="text-warm-500">
          ({formatPercentage(row.percentage)})
        </span>
      </p>
    </div>
  );
}

function CategoryChartBody({
  chartData,
  empty,
  emptyMessage,
  currency,
}: {
  chartData: SliceRow[];
  empty: boolean;
  emptyMessage: string;
  currency: string;
}) {
  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  if (empty) {
    return (
      <p className="flex min-h-[200px] flex-1 items-center justify-center py-12 text-sm text-warm-400">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-10 lg:items-center lg:gap-6">
      <div className="relative mx-auto h-[280px] w-full min-w-0 sm:h-[300px] lg:col-span-7 lg:mx-0 lg:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="categoryName"
              cx="50%"
              cy="50%"
              innerRadius="50%"
              outerRadius="85%"
              paddingAngle={2}
              stroke="none"
              isAnimationActive={false}
            >
              {chartData.map((entry) => (
                <Cell key={entry.categoryId} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CategoryTooltip currency={currency} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[10px] font-medium uppercase tracking-wide text-warm-400">
            Tổng chi
          </p>
          <p className="font-display text-sm font-semibold tabular-nums text-warm-900">
            {formatCurrency(total, currency)}
          </p>
        </div>
      </div>

      <ul className="flex min-w-0 flex-col gap-1 overflow-y-auto lg:col-span-3 lg:max-h-[320px] lg:pr-1">
        {chartData.map((slice) => (
          <li
            key={slice.categoryId}
            className="flex items-center gap-2 py-1.5 text-sm"
          >
            <span
              className="size-2 shrink-0 rounded-sm"
              style={{ backgroundColor: slice.color }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate font-medium text-warm-900">
              {slice.categoryName}
            </span>
            <span className="shrink-0 font-mono text-xs tabular-nums text-warm-500">
              {formatCurrency(slice.amount, currency)}
            </span>
            <span className="w-12 shrink-0 text-right font-mono text-xs font-semibold tabular-nums text-warm-900">
              {formatPercentage(slice.percentage)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CategoryChart({
  data,
  isLoading,
  embedded = false,
  currency = "VND",
  emptyMessage = "Không có dữ liệu chi tiêu",
}: CategoryChartProps) {
  const shellClass = cn(
    "flex h-full min-h-[320px] flex-col",
    !embedded && "rounded-lg border border-warm-200 bg-surface p-5 shadow-sm",
  );

  if (isLoading || data === undefined) {
    return (
      <article className={shellClass}>
        {!embedded ? (
          <>
            <SkeletonText className="mb-2 h-5 w-40" />
            <SkeletonText className="mb-5 h-4 w-32" />
          </>
        ) : null}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
          <SkeletonText className="mx-auto h-[280px] rounded-full sm:h-[300px] lg:col-span-7 lg:mx-0 lg:h-[320px]" />
          <div className="flex flex-col gap-1.5 lg:col-span-3">
            {Array.from({ length: 5 }, (_, i) => (
              <SkeletonText key={i} className="h-6 w-full" />
            ))}
          </div>
        </div>
      </article>
    );
  }

  const chartData: SliceRow[] = data.map((item) => ({
    ...item,
    value: item.amount,
  }));

  const empty =
    chartData.length === 0 || chartData.every((d) => d.value <= 0);

  return (
    <article className={shellClass}>
      {!embedded ? (
        <header className="mb-4">
          <h3 className="font-display text-base font-semibold text-warm-900">
            Phân bổ chi tiêu
          </h3>
          <p className="mt-1 text-sm text-warm-500">Theo danh mục tháng này</p>
        </header>
      ) : null}

      <CategoryChartBody
        chartData={chartData}
        empty={empty}
        emptyMessage={emptyMessage}
        currency={currency}
      />
    </article>
  );
}
