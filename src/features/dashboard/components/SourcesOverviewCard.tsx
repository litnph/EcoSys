import { motion } from "framer-motion";

import {
  SkeletonAvatar,
  SkeletonText,
} from "@/shared/components/ui/Skeleton";
import { formatCurrency } from "@/shared/lib/formatters";
import {
  cardSlideUpMotion,
  listStaggerItemMotion,
  listStaggerMotion,
} from "@/shared/lib/animations";
import { cn } from "@/shared/lib/utils";

import type { SourceSummary } from "../types";
import { sourceTypeIcon } from "../utils/financeDisplay";

function SourceThumb({ type }: { type: string }) {
  const Icon = sourceTypeIcon(type);
  return <Icon className="size-5 text-warm-600" aria-hidden />;
}

type SourcesOverviewCardProps = {
  sources: SourceSummary[] | undefined;
  isLoading: boolean;
};

function utilizationTone(usedPct: number | null): string {
  if (usedPct === null) return "bg-accent";
  if (usedPct > 90) return "bg-danger";
  if (usedPct > 70) return "bg-warning";
  return "bg-success";
}

export function SourcesOverviewCard({
  sources,
  isLoading,
}: SourcesOverviewCardProps) {
  if (isLoading || sources === undefined) {
    return (
      <motion.article
        {...cardSlideUpMotion}
        className="flex flex-col gap-4 rounded-card border border-warm-200 bg-surface p-5 shadow-sm"
      >
        <SkeletonText className="h-6 w-[45%]" />
        {[0, 1, 2].map((k) => (
          <div key={k} className="flex items-center gap-3">
            <SkeletonAvatar />
            <div className="flex-1 space-y-2">
              <SkeletonText className="h-4 w-2/5" />
              <SkeletonText className="h-4 w-3/5" />
            </div>
          </div>
        ))}
      </motion.article>
    );
  }

  return (
    <motion.article
      {...cardSlideUpMotion}
      className="flex flex-col gap-4 rounded-card border border-warm-200 bg-surface p-5 shadow-sm"
    >
      <h3 className="font-display text-base font-semibold text-warm-900">
        Nguồn tiền
      </h3>
      <motion.ul
        {...listStaggerMotion}
        className="flex flex-col divide-y divide-warm-100"
      >
        {sources.length === 0 ? (
          <li className="py-8 text-center text-sm text-warm-400">
            Chưa có nguồn tiền
          </li>
        ) : (
          sources.map((s) => (
            <motion.li
              key={s.sourceId}
              {...listStaggerItemMotion}
              className="flex flex-col gap-2 py-3 first:pt-0"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2">
                  <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-warm-50 ring-1 ring-warm-200">
                    <SourceThumb type={s.type} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-warm-900">
                      {s.sourceName}
                    </p>
                    <p className="truncate text-xs text-warm-400">
                      {s.type.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
                <p className="shrink-0 font-mono text-sm font-semibold text-warm-900">
                  {formatCurrency(s.balance)}
                </p>
              </div>
              {s.creditLimit !== null && s.creditLimit !== undefined && (
                <div className="space-y-1 ps-12">
                  <div className="flex justify-between text-xs text-warm-400">
                    <span>Dùng thẻ</span>
                    <span className="font-mono text-warm-600">
                      {s.usedPercentage !== null ? `${String(s.usedPercentage)}%` : "—"}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-warm-100">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        utilizationTone(s.usedPercentage))}
                      style={{
                        width: `${String(
                          Math.min(100, s.usedPercentage ?? 0))}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </motion.li>
          ))
        )}
      </motion.ul>
    </motion.article>
  );
}
