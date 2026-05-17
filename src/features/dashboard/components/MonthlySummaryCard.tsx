"use client";

import { motion } from "framer-motion";

import {
  SkeletonText,
  SkeletonTitle,
} from "@/shared/components/ui/Skeleton";
import { cn } from "@/shared/lib/utils";
import { formatCurrency, formatPercentage } from "@/shared/lib/formatters";
import { slideUp } from "@/shared/lib/animations";

import type { DashboardSummary } from "../types";

type MonthlySummaryCardProps = {
  summary: DashboardSummary | undefined;
  isLoading: boolean;
};

export function MonthlySummaryCard({
  summary,
  isLoading,
}: MonthlySummaryCardProps) {
  if (isLoading || summary === undefined) {
    return (
      <motion.article
        variants={slideUp}
        className="flex flex-col gap-4 rounded-card border border-warm-200 bg-surface p-5 shadow-sm"
      >
        <SkeletonTitle className="h-5 w-1/2" />
        <div className="space-y-3">
          <SkeletonText />
          <SkeletonText />
          <SkeletonText className="w-2/3" />
        </div>
      </motion.article>
    );
  }

  const barMagn = Math.min(100, Math.abs(summary.monthlySavingsRate));

  return (
    <motion.article
      variants={slideUp}
      className="flex flex-col gap-5 rounded-card border border-warm-200 bg-surface p-5 shadow-sm"
    >
      <h3 className="font-display text-base font-semibold text-warm-900">
        Tháng này
      </h3>
      <ul className="grid gap-3 text-sm">
        <li className="flex justify-between gap-3">
          <span className="text-warm-500">Thu</span>
          <span className="font-mono font-medium text-success">
            {formatCurrency(summary.monthlyIncome)}
          </span>
        </li>
        <li className="flex justify-between gap-3">
          <span className="text-warm-500">Chi</span>
          <span className="font-mono font-medium text-danger">
            {formatCurrency(summary.monthlyExpense)}
          </span>
        </li>
        <li className="flex justify-between gap-3">
          <span className="text-warm-500">Tiết kiệm</span>
          <span
            className={cn(
              "font-mono font-medium",
              summary.monthlySavingsRate >= 0
                ? "text-accent"
                : "text-danger",
            )}
          >
            {formatPercentage(summary.monthlySavingsRate)}
          </span>
        </li>
      </ul>
      <div>
        <div className="mb-2 flex justify-between text-xs text-warm-400">
          <span>Tỷ lệ tiết kiệm</span>
          <span className="font-mono text-warm-600">
            {formatPercentage(summary.monthlySavingsRate)}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-warm-100">
          <div
            className={cn(
              "h-full rounded-full bg-gradient-to-r",
              summary.monthlySavingsRate >= 0
                ? "from-accent to-accent-light"
                : "bg-danger",
            )}
            style={{ width: `${String(barMagn)}%` }}
          />
        </div>
      </div>
    </motion.article>
  );
}
