"use client";

import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { warmPaletteColor } from "@/features/dashboard/utils/warmPalette";
import { SkeletonText } from "@/shared/components/ui/Skeleton";
import { formatCurrency, formatPercentage } from "@/shared/lib/formatters";
import { cardSlideUpMotion } from "@/shared/lib/animations";
import { cn } from "@/shared/lib/utils";

import type { CategoryBreakdownItem } from "../types";

export interface CategoryBreakdownChartProps {
  data: CategoryBreakdownItem[] | undefined;
  isLoading: boolean;
  onCategorySelect?: (
    slice: Pick<CategoryBreakdownItem, "categoryId" | "categoryName"> & {
      year: number;
      month: number;
    }) => void;
  year: number;
  month: number;
}

type Row = CategoryBreakdownItem & {
  label: string;
  color: string;
};

type TooltipProps = {
  active?: boolean;
  payload?: ReadonlyArray<{ payload: Row }>;
};

function CustomTooltip({ active, payload }: TooltipProps) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="rounded-lg border border-warm-200 bg-surface px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-warm-900">{row.categoryName}</p>
      <p className="font-mono text-warm-800">
        {formatCurrency(row.amount)}{" "}
        <span className="text-warm-500">
          · {formatPercentage(row.percentageOfTotalExpense)}
        </span>
      </p>
    </div>
  );
}

export function CategoryBreakdownChart({
  data,
  isLoading,
  onCategorySelect,
  year,
  month,
}: CategoryBreakdownChartProps) {
  if (isLoading || data === undefined) {
    return (
      <motion.article
        {...cardSlideUpMotion}
        className="flex flex-col rounded-card border border-warm-200 bg-surface p-5 shadow-sm"
      >
        <SkeletonText className="mb-6 h-6 w-2/5" />
        <div className="h-[280px] w-full">
          <SkeletonText className="h-full rounded-card" />
        </div>
      </motion.article>
    );
  }

  const sorted = [...data]
    .filter((d) => d.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const rows: Row[] = sorted.slice(0, 12).map((d, idx) => ({
    ...d,
    label:
      d.categoryName.length > 22 ? `${d.categoryName.slice(0, 21)}…` : d.categoryName,
    color: warmPaletteColor(idx),
  }));

  const empty = rows.length === 0;

  const handleBarClick = (evt: unknown) => {
    if (!onCategorySelect || !evt) return;
    const payload = evt as { payload?: Row };
    const pl = payload.payload;
    if (!pl?.categoryId) return;
    onCategorySelect({
      categoryId: pl.categoryId,
      categoryName: pl.categoryName,
      year,
      month,
    });
  };

  return (
    <motion.article
      {...cardSlideUpMotion}
      className={cn("flex flex-col rounded-card border border-warm-200 bg-surface p-5 shadow-sm")}
    >
      <header className="mb-3 flex flex-col gap-1">
        <h3 className="font-display text-base font-semibold text-warm-900">
          Chi tiêu theo danh mục
        </h3>
        <p className="text-xs text-warm-500">
          Click một cột để xem giao dịch đã lọc theo danh mục trong tháng.
        </p>
      </header>
      {empty ? (
        <p className="py-24 text-center text-sm text-warm-400">Không có dữ liệu chi trong tháng</p>
      ) : (
        <div className={cn("h-[320px] w-full pb-10")}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={rows}
              margin={{ top: 4, bottom: 4, left: 8, right: 16 }}
            >
              <CartesianGrid
                horizontal
                vertical={false}
                strokeDasharray="4 10"
                stroke="var(--color-warm-200)"
              />
              <XAxis
                type="number"
                stroke="var(--color-warm-400)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={112}
                stroke="var(--color-warm-500)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-warm-50)" }} />
              <Bar
                dataKey="amount"
                radius={[0, 4, 4, 0]}
                maxBarSize={22}
                isAnimationActive={false}
                onClick={handleBarClick}
                className={onCategorySelect ? "cursor-pointer" : undefined}
              >
                {rows.map((cell, ci) => (
                  <Cell
                    key={`${cell.categoryId ?? `u-${ci}`}-${ci}`}
                    fill={cell.color}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.article>
  );
}
