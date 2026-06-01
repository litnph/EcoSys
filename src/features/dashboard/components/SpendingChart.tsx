import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SkeletonText } from "@/shared/components/ui/Skeleton";
import { formatCurrency } from "@/shared/lib/formatters";

import type { MonthlyTrendPoint } from "../types";

type TrendRow = MonthlyTrendPoint & { label: string };

type SpendingChartProps = {
  data: MonthlyTrendPoint[] | undefined;
  isLoading: boolean;
};

type TrendTooltipProps = {
  active?: boolean;
  payload?: ReadonlyArray<{ payload: TrendRow }>;
};

function TrendTooltip({ active, payload }: TrendTooltipProps) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;

  return (
    <div className="rounded-lg border border-warm-200 bg-surface px-3 py-2 shadow-md">
      <p className="mb-1.5 text-xs font-medium text-warm-500">{row.label}</p>
      <p className="font-mono text-sm text-success">
        Thu · {formatCurrency(row.income)}
      </p>
      <p className="font-mono text-sm text-danger">
        Chi · {formatCurrency(row.expense)}
      </p>
    </div>
  );
}

const compactAxis = new Intl.NumberFormat("vi-VN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function SpendingChart({ data, isLoading }: SpendingChartProps) {
  if (isLoading || data === undefined) {
    return (
      <article className="flex h-full min-h-[320px] flex-col rounded-lg border border-warm-200 bg-surface p-5 shadow-sm">
        <SkeletonText className="mb-2 h-5 w-56" />
        <SkeletonText className="mb-5 h-4 w-40" />
        <SkeletonText className="min-h-[260px] flex-1 rounded-lg" />
      </article>
    );
  }

  const merged: TrendRow[] = data.map((d) => ({
    ...d,
    label: `${String(d.month).padStart(2, "0")}/${String(d.year)}`,
  }));

  const empty = merged.length === 0;

  return (
    <article className="flex h-full min-h-[320px] flex-col rounded-lg border border-warm-200 bg-surface p-5 shadow-sm">
      <header className="mb-5">
        <h3 className="font-display text-base font-semibold text-warm-900">
          Thu vs Chi — 6 tháng gần nhất
        </h3>
        <p className="mt-1 text-sm text-warm-500">
          Xu hướng dòng tiền hàng tháng
        </p>
      </header>
      {empty ? (
        <p className="flex flex-1 items-center justify-center text-sm text-warm-400">
          Chưa có dữ liệu xu hướng
        </p>
      ) : (
        <div className="min-h-0 flex-1">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={merged}
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
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <YAxis
                stroke="var(--color-warm-400)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => compactAxis.format(v)}
                width={56}
              />
              <Tooltip content={<TrendTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                height={28}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, color: "var(--color-warm-500)" }}
              />
              <Line
                type="monotone"
                dataKey="income"
                name="Thu nhập"
                stroke="var(--color-success)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--color-success)", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="expense"
                name="Chi tiêu"
                stroke="var(--color-danger)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--color-danger)", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  );
}
