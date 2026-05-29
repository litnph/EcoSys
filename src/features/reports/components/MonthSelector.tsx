import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/shared/components/ui/Button";
import { cn } from "@/shared/lib/utils";

export interface MonthSelectorProps {
  year: number;
  month: number;
  onChange: (next: { year: number; month: number }) => void;
  className?: string;
  /** Upper bound for month navigation (inclusive). Defaults to year 2100-12. */
  maxYear?: number;
  maxMonth?: number;
}

function shiftMonth(y: number, m: number, delta: number): { year: number; month: number } {
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

export function MonthSelector({
  year,
  month,
  onChange,
  className,
  maxYear = 2100,
  maxMonth = 12,
}: MonthSelectorProps) {
  const nextYm = shiftMonth(year, month, 1);

  const canGoNext =
    nextYm.year < maxYear
    || (nextYm.year === maxYear && nextYm.month <= maxMonth);

  const label = `Tháng ${String(month)}/${String(year)}`;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="shrink-0"
        aria-label="Tháng trước"
        leftIcon={<ChevronLeft className="size-4" aria-hidden />}
        onClick={() => {
          onChange(shiftMonth(year, month, -1));
        }}
      />
      <p className="min-w-[8.5rem] text-center font-display text-lg font-semibold tracking-tight text-warm-900">
        {label}
      </p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="shrink-0"
        aria-label="Tháng sau"
        disabled={!canGoNext}
        leftIcon={<ChevronRight className="size-4" aria-hidden />}
        onClick={() => {
          if (!canGoNext) return;
          onChange(nextYm);
        }}
      />
    </div>
  );
}
