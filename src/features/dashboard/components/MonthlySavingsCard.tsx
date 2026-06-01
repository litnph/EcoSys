import { format } from "date-fns";
import { vi } from "date-fns/locale";

import { SkeletonText } from "@/shared/components/ui/Skeleton";
import {
  formatCurrency,
  formatPercentage,
} from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";

/** Soft monthly savings target for progress ring (30% of income). */
const SAVINGS_TARGET_RATE = 30;

const RING_SIZE = 120;
const STROKE = 10;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export type MonthlySavingsCardProps = {
  isLoading: boolean;
  savingsRate: number | null;
  savedAmount: number;
  incomeAmount: number;
  /** e.g. "Cuối tháng · 30 tháng 6 2026" — defaults to today */
  periodHint?: string;
  title?: string;
  subtitle?: string;
};

export function MonthlySavingsCard({
  isLoading,
  savingsRate,
  savedAmount,
  incomeAmount,
  periodHint,
  title = "Tiết kiệm tháng này",
  subtitle = `Mục tiêu ${SAVINGS_TARGET_RATE}% thu nhập`,
}: MonthlySavingsCardProps) {
  if (isLoading) {
    return (
      <article className="flex h-full flex-col rounded-lg border border-warm-200 bg-surface p-5 shadow-sm">
        <SkeletonText className="mb-4 h-5 w-40" />
        <SkeletonText className="mx-auto h-[120px] w-[120px] rounded-full" />
        <SkeletonText className="mt-4 h-4 w-full" />
      </article>
    );
  }

  const rate = savingsRate ?? 0;
  const positive = rate >= 0;
  const targetAmount =
    incomeAmount > 0
      ? Math.round((incomeAmount * SAVINGS_TARGET_RATE) / 100)
      : 0;

  const progress =
    targetAmount > 0
      ? Math.min(100, Math.round((savedAmount / targetAmount) * 100))
      : positive
        ? Math.min(100, Math.round(rate))
        : 0;

  const offset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;
  const hint =
    periodHint ??
    `Cuối tháng · ${format(new Date(), "d MMMM yyyy", { locale: vi })}`;

  return (
    <article className="flex h-full flex-col rounded-lg border border-warm-200 bg-surface p-5 shadow-sm">
      <header className="mb-4">
        <h3 className="font-display text-base font-semibold text-warm-900">
          {title}
        </h3>
        <p className="mt-1 text-sm text-warm-500">{subtitle}</p>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-5">
        <div
          className="relative"
          style={{ width: RING_SIZE, height: RING_SIZE }}
          role="img"
          aria-label={`Tỷ lệ tiết kiệm ${formatPercentage(rate)}`}
        >
          <svg
            width={RING_SIZE}
            height={RING_SIZE}
            className="-rotate-90"
            aria-hidden
          >
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="var(--color-warm-100)"
              strokeWidth={STROKE}
            />
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={positive ? "var(--color-accent)" : "var(--color-danger)"}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={cn(
                "font-display text-2xl font-semibold tabular-nums",
                positive ? "text-warm-900" : "text-danger",
              )}
            >
              {savingsRate === null ? "—" : formatPercentage(rate)}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wide text-warm-400">
              Tỷ lệ
            </span>
          </div>
        </div>

        <div className="w-full space-y-2 text-center">
          <p className="font-mono text-sm font-semibold tabular-nums text-warm-900">
            {formatCurrency(savedAmount)}
            {targetAmount > 0 ? (
              <span className="font-normal text-warm-400">
                {" "}
                / {formatCurrency(targetAmount)}
              </span>
            ) : null}
          </p>
          <p className="text-xs text-warm-500">{hint}</p>
        </div>

        <div className="w-full">
          <div className="mb-1 flex justify-between text-[11px] text-warm-500">
            <span>Tiến độ mục tiêu</span>
            <span className="tabular-nums">{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-warm-100">
            <div
              className={cn(
                "h-full rounded-full",
                positive ? "bg-accent" : "bg-danger",
              )}
              style={{ width: `${String(progress)}%` }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
