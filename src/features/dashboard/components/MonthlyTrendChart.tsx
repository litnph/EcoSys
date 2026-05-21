"use client";

import { motion } from "framer-motion";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SkeletonText } from "@/shared/components/ui/Skeleton";
import { formatCurrency } from "@/shared/lib/formatters";
import { cardSlideUpMotion } from "@/shared/lib/animations";

import type { MonthlyTrendPoint } from "../types";

type MonthlyTrendChartProps = {
  data: MonthlyTrendPoint[] | undefined;
  isLoading: boolean;
};

type TrendRow = MonthlyTrendPoint & { label: string };

type TrendTooltipProps = {
  active?: boolean;
  payload?: ReadonlyArray<{ payload: TrendRow }>;
};

function TrendTooltip({ active, payload }: TrendTooltipProps) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;

  return (
    <div className="rounded-lg border border-warm-200 bg-surface px-3 py-2 shadow-md">
      <p className="mb-2 text-xs font-medium text-warm-500">{row.label}</p>
      <p className="font-mono text-sm text-success">
        Thu · {formatCurrency(row.income)}
      </p>
      <p className="font-mono text-sm text-danger">
        Chi · {formatCurrency(row.expense)}
      </p>
    </div>
  );
}

export function MonthlyTrendChart({
  data,
  isLoading,
}: MonthlyTrendChartProps) {
  if (isLoading || data === undefined) {
    return (
      <motion.article
        {...cardSlideUpMotion}
        className="flex flex-col rounded-card border border-warm-200 bg-surface p-5 shadow-sm"
      >
        <SkeletonText className="mb-6 h-6 w-3/5" />
        <div className="h-72">
          <SkeletonText className="h-full rounded-card" />
        </div>
      </motion.article>
    );
  }

  const merged: TrendRow[] = data.map((d) => ({
    ...d,
    label: `${String(d.month).padStart(2, "0")}/${String(d.year)}`,
  }));

  const compactAxis = new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
  });

  return (
    <motion.article
      {...cardSlideUpMotion}
      className="flex flex-col rounded-card border border-warm-200 bg-surface p-5 shadow-sm"
    >
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h3 className="font-display text-base font-semibold text-warm-900">
          Xu hướng tháng gần đây
        </h3>
        <div className="flex flex-wrap gap-3 text-xs text-warm-500">
          <span className="inline-flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: "var(--color-success)" }}
            />
            Thu
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: "var(--color-danger)" }}
            />
            Chi
          </span>
        </div>
      </header>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={merged}
            margin={{ top: 6, bottom: 0, left: -12, right: 8 }}
          >
            <CartesianGrid
              stroke="var(--color-warm-200)"
              strokeDasharray="6 10"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              stroke="var(--color-warm-400)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              tickMargin={8}
            />
            <YAxis
              stroke="var(--color-warm-400)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => compactAxis.format(v)}
              width={72}
              tickMargin={4}
            />
            <Tooltip
              content={<TrendTooltip />}
              cursor={{
                stroke: "var(--color-warm-200)",
                strokeWidth: 1,
              }}
            />
            <Line
              type="monotone"
              dataKey="income"
              name="Thu"
              stroke="var(--color-success)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 4,
                stroke: "var(--color-success)",
                strokeWidth: 2,
                fill: "#fff",
              }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="expense"
              name="Chi"
              stroke="var(--color-danger)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 4,
                stroke: "var(--color-danger)",
                strokeWidth: 2,
                fill: "#fff",
              }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.article>
  );
}
