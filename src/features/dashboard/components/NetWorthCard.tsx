"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

import { Badge } from "@/shared/components/ui/Badge";
import { AnimatedAmount } from "@/shared/components/ui/AnimatedAmount";
import { SkeletonTitle, SkeletonText } from "@/shared/components/ui/Skeleton";
import { formatCurrency, formatPercentage } from "@/shared/lib/formatters";
import { cardSlideUpMotion } from "@/shared/lib/animations";

import type { DashboardSummary } from "../types";

type NetWorthCardProps = {
  summary: DashboardSummary | undefined;
  isLoading: boolean;
};

/** Approximate WoM net-worth change hint from cashflow vs implied prior balance. */
function netWorthChangePercent(summary: DashboardSummary): number | null {
  const flow = summary.monthlyIncome - summary.monthlyExpense;
  const impliedPrev = summary.netWorth - flow;
  if (Math.abs(impliedPrev) < 1) {
    return null;
  }
  return (flow / impliedPrev) * 100;
}

export function NetWorthCard({ summary, isLoading }: NetWorthCardProps) {
  const t = useTranslations("dashboard");

  if (isLoading || summary === undefined) {
    return (
      <motion.article
        {...cardSlideUpMotion}
        className="flex flex-col gap-6 rounded-card border border-warm-200 bg-surface p-5 shadow-sm md:p-6"
      >
        <div>
          <p className="text-sm font-medium text-warm-500">{t("netWorth")}</p>
          <SkeletonTitle className="mt-2 h-9 w-[70%]" />
        </div>
        <SkeletonText className="h-12 w-[40%] rounded-badge" />
      </motion.article>
    );
  }

  const pct = netWorthChangePercent(summary);
  const up = pct === null ? null : pct >= 0;

  return (
    <motion.article
      {...cardSlideUpMotion}
      className="flex flex-col justify-between gap-6 rounded-card border border-warm-200 bg-gradient-to-br from-surface to-warm-25 p-5 shadow-md md:p-7"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-warm-500">{t("netWorth")}</p>
          <p className="mt-2 font-mono text-3xl font-semibold tracking-tight text-warm-900 sm:text-4xl md:text-[2.65rem]">
            <AnimatedAmount value={summary.netWorth} />
          </p>
        </div>
        {pct !== null ? (
          <Badge
            variant={up ? "success" : "danger"}
            size="md"
            className="inline-flex items-center gap-1 font-mono"
          >
            {up ? (
              <ArrowUpRight className="size-4 shrink-0" aria-hidden />
            ) : (
              <ArrowDownRight className="size-4 shrink-0" aria-hidden />
            )}
            {formatPercentage(Math.abs(pct), 1)}
          </Badge>
        ) : null}
      </header>
      <footer className="text-xs text-warm-400">
        {pct === null ? (
          <span>{t("netWorthFootnoteIdle")}</span>
        ) : (
          <span>
            {t("netWorthFootnoteActive", {
              prior: formatCurrency(summary.previousMonthNet),
            })}
          </span>
        )}
      </footer>
    </motion.article>
  );
}
