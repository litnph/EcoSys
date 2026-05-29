import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, type ReactNode } from "react";

import { formatCurrency, formatPercentage } from "@/shared/lib/formatters";
import {
  cardHoverMotion,
  listStaggerItemMotion,
  listStaggerMotion,
} from "@/shared/lib/animations";
import { cn } from "@/shared/lib/utils";

import type { MonthlyReport } from "../types";
import { estimatedPreviousSavingsRatePercent } from "../utils/savingsComparison";

export interface ReportSummaryCardsProps {
  report: MonthlyReport | undefined;
  className?: string;
}

function compareDeltaPct(
  currentRate: number | null,
  totalIncome: number,
  totalExpense: number,
  comparison: MonthlyReport["comparisonWithPrevious"]): number | null {
  if (currentRate === null) return null;
  const prevSr = estimatedPreviousSavingsRatePercent({
    totalIncome,
    totalExpense,
    comparison,
  });
  if (prevSr === null || Math.abs(prevSr) < 0.001) return null;
  return Math.round(((currentRate - prevSr) / Math.abs(prevSr)) * 10000) / 100;
}

function MomTrend({
  label,
  pct,
  polarity,
}: {
  label?: string;
  pct: number | null;
  polarity: "higherBetter" | "lowerBetter";
}) {
  if (pct === null || Number.isNaN(pct)) {
    return (
      <span className="flex items-center gap-1 text-xs text-warm-400">
        {label ? `${label}: ` : null}
        —
      </span>
    );
  }
  const good =
    polarity === "higherBetter" ? pct >= 0 : pct <= 0;
  const Icon = Object.is(pct, 0) ? Minus : pct > 0 ? TrendingUp : TrendingDown;

  const labelText = Object.is(pct, 0)
    ? formatPercentage(0, 2)
    : `${pct > 0 ? "+" : "-"}${formatPercentage(Math.abs(pct), 2)}`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs tabular-nums",
        Object.is(pct, 0) ? "text-warm-400" : good ? "text-success" : "text-danger")}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {labelText}
    </span>
  );
}

type CardProps = {
  title: string;
  subtitle: ReactNode;
  valueClass: string;
  value: ReactNode;
};

function MiniCard({ title, subtitle, valueClass, value }: CardProps) {
  return (
    <motion.article
      {...listStaggerItemMotion}
      {...cardHoverMotion}
      className={cn(
        "flex flex-col gap-2 rounded-card border border-warm-200 bg-surface px-4 py-3 shadow-sm")}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-warm-500">{title}</p>
      <p className={cn("font-display text-xl font-semibold tabular-nums", valueClass)}>{value}</p>
      <div className="min-h-[1rem]">{subtitle}</div>
    </motion.article>
  );
}

export function ReportSummaryCards({ report, className }: ReportSummaryCardsProps) {
  const savingsPctDelta = useMemo(() => {
    if (!report) return null;
    return compareDeltaPct(
      report.savingsRate,
      report.totalIncome,
      report.totalExpense,
      report.comparisonWithPrevious);
  }, [report]);

  if (!report) {
    return (
      <div
        className={cn(
          "grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
          className)}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[110px] animate-pulse rounded-card border border-warm-100 bg-warm-50/70"
          />
        ))}
      </div>
    );
  }

  const comp = report.comparisonWithPrevious;
  const netClass =
    report.net >= 0 ? "text-accent" : "text-danger";

  const savingsVs =
    report.savingsRate === null ? "—"
      : formatPercentage(report.savingsRate);

  return (
    <motion.div
      {...listStaggerMotion}
      className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4", className)}
    >
      <MiniCard
        title="Thu nhập"
        valueClass="text-success"
        value={formatCurrency(report.totalIncome)}
        subtitle={
          <MomTrend polarity="higherBetter" pct={comp.incomeChangePercent} />
        }
      />
      <MiniCard
        title="Chi tiêu"
        valueClass="text-danger"
        value={formatCurrency(report.totalExpense)}
        subtitle={
          <MomTrend polarity="lowerBetter" pct={comp.expenseChangePercent} />
        }
      />
      <MiniCard
        title="Tiết kiệm ròng"
        valueClass={netClass}
        value={formatCurrency(report.net)}
        subtitle={<MomTrend polarity="higherBetter" pct={comp.netChangePercent} />}
      />
      <MiniCard
        title="Tỷ lệ tiết kiệm"
        valueClass="text-accent"
        value={savingsVs}
        subtitle={
          <MomTrend polarity="higherBetter" pct={savingsPctDelta} />
        }
      />
    </motion.div>
  );
}
