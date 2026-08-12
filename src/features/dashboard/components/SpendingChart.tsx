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
import { DataTableScrollRegion } from "@/shared/components/ui/DataTableScrollRegion";
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
        Thu · {formatCurrency(row.income, row.currency)}
      </p>
      <p className="font-mono text-sm text-danger">
        Chi · {formatCurrency(row.expense, row.currency)}
      </p>
    </div>
  );
}

const compactAxis = new Intl.NumberFormat("vi-VN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function SpendingChart({ data, isLoading }: SpendingChartProps) {
  const titleId = "dashboard-income-expense-trend-title";
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
    <article
      aria-labelledby={titleId}
      className="flex h-full min-h-[320px] flex-col rounded-card border border-warm-200 bg-surface p-5 shadow-sm"
    >
      <header className="mb-5">
        <h3
          id={titleId}
          className="font-display text-base font-semibold text-warm-900"
        >
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
              accessibilityLayer
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
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-medium text-accent outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
              Dữ liệu biểu đồ
            </summary>
            <DataTableScrollRegion
              label="Dữ liệu thu chi 6 tháng gần nhất"
              className="mt-2 rounded-button border border-warm-200"
            >
              <table className="w-full min-w-[420px] text-sm">
                <caption className="sr-only">
                  Thu nhập và chi tiêu theo tháng, đơn vị tiền tệ hiện tại
                </caption>
                <thead className="bg-warm-50 text-left text-warm-600">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">Tháng</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Thu nhập</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Chi tiêu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100">
                  {merged.map((row) => (
                    <tr key={`${String(row.year)}-${String(row.month)}`}>
                      <th scope="row" className="px-3 py-2 text-left font-medium text-warm-800">
                        {row.label}
                      </th>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-success">
                        {formatCurrency(row.income, row.currency)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-danger">
                        {formatCurrency(row.expense, row.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataTableScrollRegion>
          </details>
        </div>
      )}
    </article>
  );
}
