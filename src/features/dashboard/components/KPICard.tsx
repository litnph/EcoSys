import { TrendingDown, TrendingUp } from "lucide-react";

import { SkeletonText } from "@/shared/components/ui/Skeleton";
import { formatCurrency } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";

import type { KpiMetric } from "../utils/buildDashboardKpis";

type KPICardProps = {
  metric: KpiMetric;
};

type KPICardSkeletonProps = {
  className?: string;
};

function formatChangePercent(value: number): string {
  const abs = Math.abs(value).toFixed(1);
  return value >= 0 ? `+${abs}%` : `-${abs}%`;
}

export function KPICardSkeleton({ className }: KPICardSkeletonProps) {
  return (
    <article
      className={cn(
        "min-h-28 bg-surface p-3.5 sm:min-h-32 sm:p-4",
        className,
      )}
    >
      <SkeletonText className="h-4 w-28" />
      <SkeletonText className="mt-4 h-3 w-20 sm:mt-5 sm:w-24" />
      <SkeletonText className="mt-2 h-7 w-28 sm:h-8 sm:w-36" />
    </article>
  );
}

export function KPICard({ metric }: KPICardProps) {
  const Icon = metric.icon;
  const changePercent = metric.changePercent;
  const hasChange = changePercent !== null;
  const isPositiveChange = hasChange && changePercent >= 0;
  const changeIsGood = hasChange
    ? metric.positiveChangeIsGood
      ? isPositiveChange
      : !isPositiveChange
    : null;
  const TrendIcon = isPositiveChange ? TrendingUp : TrendingDown;

  return (
    <article className="min-h-28 bg-surface p-3.5 sm:min-h-32 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-2 text-xs font-semibold text-warm-600">
          <Icon className={cn("size-4 shrink-0", metric.iconClassName.replace(/bg-\S+/g, ""))} strokeWidth={1.8} aria-hidden />
          <span>{metric.label}</span>
        </p>
        {hasChange ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold tabular-nums",
              changeIsGood
                ? "bg-success/10 text-success"
                : "bg-danger/10 text-danger",
            )}
          >
            <TrendIcon className="size-3.5 shrink-0" aria-hidden />
            {formatChangePercent(changePercent)}
          </span>
        ) : (
          <span className="text-xs text-warm-400">—</span>
        )}
      </div>
      <p className="mt-4 break-words font-amount text-lg font-semibold tabular-nums text-warm-900 sm:mt-5 sm:text-xl">
        {formatCurrency(metric.amount, metric.currency)}
      </p>
      <p className="mt-1.5 text-[11px] font-medium text-warm-500">So với tháng trước</p>
    </article>
  );
}
