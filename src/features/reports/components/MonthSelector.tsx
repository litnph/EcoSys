"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/shared/components/ui/Button";
import { cn } from "@/shared/lib/utils";

import { currentUtcYearMonth } from "../utils/months";

export interface MonthSelectorProps {
  year: number;
  month: number;
  onChange: (next: { year: number; month: number }) => void;
  className?: string;
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
}: MonthSelectorProps) {
  const now = currentUtcYearMonth();
  const isFuture = (cy: number, cm: number) =>
    cy > now.year || (cy === now.year && cm > now.month);

  const nextYm = shiftMonth(year, month, 1);

  const canGoNext =
    !(isFuture(nextYm.year, nextYm.month));

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
