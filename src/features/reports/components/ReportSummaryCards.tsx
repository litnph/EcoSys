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
import { computeReportExpenseBreakdown } from "../utils/reportExpenseBreakdown";
import { estimatedPreviousSavingsRatePercent } from "../utils/savingsComparison";

export interface ReportSummaryCardsProps {
  report: MonthlyReport | undefined;
  className?: string;
}

function compareDeltaPct(
  currentRate: number | null,
  totalIncome: number,
  totalExpense: number,
  comparison: MonthlyReport["comparisonWithPrevious"],
): number | null {
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
  pct,
  polarity,
}: {
  pct: number | null;
  polarity: "higherBetter" | "lowerBetter";
}) {
  if (pct === null || Number.isNaN(pct)) {
    return <span className="text-xs text-warm-400">So với tháng trước: —</span>;
  }
  const good = polarity === "higherBetter" ? pct >= 0 : pct <= 0;
  const Icon = Object.is(pct, 0) ? Minus : pct > 0 ? TrendingUp : TrendingDown;
  const labelText = Object.is(pct, 0)
    ? formatPercentage(0, 2)
    : `${pct > 0 ? "+" : "-"}${formatPercentage(Math.abs(pct), 2)}`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs tabular-nums",
        Object.is(pct, 0) ? "text-warm-400" : good ? "text-success" : "text-danger",
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      So với tháng trước: {labelText}
    </span>
  );
}

function ExpenseMetric({
  label,
  hint,
  amount,
  tone,
  emphasis = false,
}: {
  label: string;
  hint: string;
  amount: number;
  tone: "warm" | "accent" | "danger";
  emphasis?: boolean;
}) {
  const toneClass =
    tone === "danger"
      ? "text-danger"
      : tone === "accent"
        ? "text-accent-emphasis"
        : "text-warm-900";

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-xl border px-4 py-3",
        emphasis
          ? "border-danger/25 bg-danger/5"
          : "border-warm-200 bg-surface",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-warm-500">
        {label}
      </p>
      <p
        className={cn(
          "font-display font-semibold tabular-nums",
          emphasis ? "text-2xl" : "text-xl",
          toneClass,
        )}
      >
        {formatCurrency(amount)}
      </p>
      <p className="text-[11px] leading-snug text-warm-500">{hint}</p>
    </div>
  );
}

function SecondaryMetric({
  title,
  value,
  valueClass,
  footer,
}: {
  title: string;
  value: ReactNode;
  valueClass: string;
  footer: ReactNode;
}) {
  return (
    <motion.article
      {...listStaggerItemMotion}
      {...cardHoverMotion}
      className="flex flex-col gap-2 rounded-card border border-warm-200 bg-surface px-4 py-3 shadow-sm"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-warm-500">
        {title}
      </p>
      <p className={cn("font-display text-xl font-semibold tabular-nums", valueClass)}>
        {value}
      </p>
      <div className="min-h-[1rem]">{footer}</div>
    </motion.article>
  );
}

export function ReportSummaryCards({ report, className }: ReportSummaryCardsProps) {
  const breakdown = useMemo(
    () => (report ? computeReportExpenseBreakdown(report) : null),
    [report],
  );

  const savingsPctDelta = useMemo(() => {
    if (!report) return null;
    return compareDeltaPct(
      report.savingsRate,
      report.totalIncome,
      report.totalExpense,
      report.comparisonWithPrevious,
    );
  }, [report]);

  if (!report || !breakdown) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="h-40 animate-pulse rounded-card border border-warm-100 bg-warm-50/70" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-[100px] animate-pulse rounded-card border border-warm-100 bg-warm-50/70"
            />
          ))}
        </div>
      </div>
    );
  }

  const comp = report.comparisonWithPrevious;
  const netClass = breakdown.net >= 0 ? "text-accent" : "text-danger";
  const spendShare =
    breakdown.totalExpense > 0
      ? Math.round(
          (breakdown.transactionSpendAmount / breakdown.totalExpense) * 100,
        )
      : 0;
  const installmentShare =
    breakdown.totalExpense > 0
      ? Math.round((breakdown.installmentAmount / breakdown.totalExpense) * 100)
      : 0;

  return (
    <motion.div {...listStaggerMotion} className={cn("space-y-4", className)}>
      <section className="rounded-card border border-warm-200 bg-surface p-4 shadow-sm sm:p-5">
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-warm-900">
              Tổng quan chi tiêu
            </h2>
            <p className="mt-1 text-sm text-warm-600">
              Tổng chi = chi tiêu giao dịch + trả góp đến hạn trong tháng.
              Thanh toán kỳ sao kê không tính vào chi tiêu.
            </p>
          </div>
        </header>

        <div className="grid gap-3 md:grid-cols-3">
          <ExpenseMetric
            label="Chi tiêu"
            hint={`Trực tiếp ${formatCurrency(breakdown.directAmount)} · Thẻ ${formatCurrency(breakdown.cardSpendAmount)}`}
            amount={breakdown.transactionSpendAmount}
            tone="warm"
          />
          <ExpenseMetric
            label="Trả góp tháng này"
            hint="Các kỳ trả góp đến hạn trong sao kê phát hành tháng này"
            amount={breakdown.installmentAmount}
            tone="accent"
          />
          <ExpenseMetric
            label="Tổng chi"
            hint="Dùng cho so sánh thu — chi và tỷ lệ tiết kiệm"
            amount={breakdown.totalExpense}
            tone="danger"
            emphasis
          />
        </div>

        {breakdown.totalExpense > 0 ? (
          <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-[11px] text-warm-500">
              <span>Giao dịch {String(spendShare)}%</span>
              <span>Trả góp {String(installmentShare)}%</span>
            </div>
            <div
              className="flex h-2 overflow-hidden rounded-full bg-warm-100"
              role="img"
              aria-label={`Chi tiêu giao dịch ${String(spendShare)} phần trăm, trả góp ${String(installmentShare)} phần trăm`}
            >
              <span
                className="bg-warm-500 transition-all"
                style={{ width: `${String(spendShare)}%` }}
              />
              <span
                className="bg-accent transition-all"
                style={{ width: `${String(installmentShare)}%` }}
              />
            </div>
          </div>
        ) : null}
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <SecondaryMetric
          title="Thu nhập"
          valueClass="text-success"
          value={formatCurrency(breakdown.totalIncome)}
          footer={<MomTrend polarity="higherBetter" pct={comp.incomeChangePercent} />}
        />
        <SecondaryMetric
          title="Còn lại (thu − chi)"
          valueClass={netClass}
          value={formatCurrency(breakdown.net)}
          footer={<MomTrend polarity="higherBetter" pct={comp.netChangePercent} />}
        />
        <SecondaryMetric
          title="Tỷ lệ tiết kiệm"
          valueClass="text-accent"
          value={
            breakdown.savingsRate === null
              ? "—"
              : formatPercentage(breakdown.savingsRate)
          }
          footer={<MomTrend polarity="higherBetter" pct={savingsPctDelta} />}
        />
      </div>
    </motion.div>
  );
}
