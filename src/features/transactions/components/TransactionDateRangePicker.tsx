"use client";

import type { DateRange } from "react-day-picker";
import { DayPicker } from "react-day-picker";
import type { Locale } from "date-fns";
import { format } from "date-fns";
import "react-day-picker/style.css";
import { Button } from "@/shared/components/ui/Button";

import type { TransactionFilterState } from "../types";

export interface TransactionDateRangePickerProps {
  range: DateRange | undefined;
  dateLocale: Locale;
  onApplyRange: (next: Partial<Pick<TransactionFilterState, "dateFrom" | "dateTo">>) => void;
  onClear: () => void;
  onDone: () => void;
  labels: {
    clearDates: string;
    done: string;
  };
}

function toIsoDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function TransactionDateRangePicker({
  range,
  dateLocale,
  onApplyRange,
  onClear,
  onDone,
  labels,
}: TransactionDateRangePickerProps) {
  return (
    <>
      <DayPicker
        mode="range"
        selected={range}
        onSelect={(next) => {
          if (!next) {
            onApplyRange({
              dateFrom: undefined,
              dateTo: undefined,
            });
            return;
          }
          onApplyRange({
            dateFrom: next.from ? toIsoDate(next.from) : undefined,
            dateTo: next.to ? toIsoDate(next.to) : undefined,
          });
        }}
        locale={dateLocale}
        className="rdp-transactions"
      />
      <div className="mt-2 flex justify-end gap-2 border-t border-warm-100 pt-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            onApplyRange({
              dateFrom: undefined,
              dateTo: undefined,
            });
            onClear();
          }}
        >
          {labels.clearDates}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onDone}>
          {labels.done}
        </Button>
      </div>
    </>
  );
}
