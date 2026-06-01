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
        "rounded-lg border border-warm-200 bg-surface p-5 shadow-sm",
        className,
      )}
    >
      <SkeletonText className="h-10 w-10 rounded-lg" />
      <SkeletonText className="mt-4 h-3 w-24" />
      <SkeletonText className="mt-2 h-8 w-36" />
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
    <article className="rounded-lg border border-warm-200 bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            metric.iconClassName,
          )}
        >
          <Icon className="size-5" strokeWidth={1.75} aria-hidden />
        </div>
        {hasChange ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium tabular-nums",
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
      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-warm-500">
        {metric.label}
      </p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-warm-900">
        {formatCurrency(metric.amount)}
      </p>
      <p className="mt-1 text-xs text-warm-400">So với tháng trước</p>
    </article>
  );
}
