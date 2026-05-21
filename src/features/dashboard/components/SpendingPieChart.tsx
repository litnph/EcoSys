"use client";

import { motion } from "framer-motion";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { SkeletonText } from "@/shared/components/ui/Skeleton";
import { formatCurrency, formatPercentage } from "@/shared/lib/formatters";
import { cardSlideUpMotion } from "@/shared/lib/animations";

import type { CategoryBreakdown } from "../types";

type SpendingPieChartProps = {
  data: CategoryBreakdown[] | undefined;
  isLoading: boolean;
};

type SliceRow = CategoryBreakdown & { name?: string; value?: number };

type SpendingTooltipProps = {
  active?: boolean;
  payload?: ReadonlyArray<{ payload: SliceRow }>;
};

function SpendingTooltip({ active, payload }: SpendingTooltipProps) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="rounded-lg border border-warm-200 bg-surface px-3 py-2 shadow-md">
      <p className="text-sm font-medium text-warm-900">{row.categoryName}</p>
      <p className="font-mono text-sm text-accent">
        {formatCurrency(row.amount)}{" "}
        <span className="text-warm-500">
          ({formatPercentage(row.percentage)})
        </span>
      </p>
    </div>
  );
}

export function SpendingPieChart({ data, isLoading }: SpendingPieChartProps) {
  if (isLoading || data === undefined) {
    return (
      <motion.article
        {...cardSlideUpMotion}
        className="flex flex-col rounded-card border border-warm-200 bg-surface p-5 shadow-sm"
      >
        <SkeletonText className="mb-6 h-6 w-2/5" />
        <div className="h-72 w-full">
          <SkeletonText className="h-full rounded-card" />
        </div>
      </motion.article>
    );
  }

  const slices: SliceRow[] = data.map((item) => ({
    ...item,
    name: item.categoryName,
    value: item.amount,
  }));

  const empty = slices.length === 0 || slices.every((d) => (d.value ?? 0) <= 0);

  return (
    <motion.article
      {...cardSlideUpMotion}
      className="flex flex-col rounded-card border border-warm-200 bg-surface p-5 shadow-sm"
    >
      <h3 className="mb-5 font-display text-base font-semibold text-warm-900">
        Chi theo nhóm
      </h3>
      {empty ? (
        <p className="py-16 text-center text-sm text-warm-400">
          Không có dữ liệu chi tiêu
        </p>
      ) : (
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
          <div className="h-[260px] min-w-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={54}
                  outerRadius={94}
                  paddingAngle={2}
                >
                  {slices.map((entry) => (
                    <Cell key={entry.categoryId} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<SpendingTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="flex max-h-[220px] w-full shrink-0 flex-col gap-2 overflow-y-auto text-xs lg:max-w-[11rem]">
            {slices.map((slice) => (
              <li
                key={slice.categoryId}
                className="flex items-start gap-2 leading-tight text-warm-700"
              >
                <span
                  className="mt-1 size-2 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="min-w-0 break-words">
                  {slice.categoryName}:{" "}
                  <span className="font-mono text-[11px] text-warm-900">
                    {formatPercentage(slice.percentage)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.article>
  );
}
