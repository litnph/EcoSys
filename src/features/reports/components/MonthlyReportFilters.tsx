import { RotateCcw, WalletCards } from "lucide-react";

import { Button } from "@/shared/components/ui/Button";

import type { SourceBreakdownItem } from "../types";
import type { MonthlyReportFilters as FilterValue } from "../utils/filterMonthlyReport";
import {
  defaultMonthlyReportFilters,
  isMonthlyReportFiltered,
} from "../utils/filterMonthlyReport";

export interface MonthlyReportFiltersProps {
  sources: SourceBreakdownItem[];
  value: FilterValue;
  onChange: (value: FilterValue) => void;
}

export function MonthlyReportFilters({
  sources,
  value,
  onChange,
}: MonthlyReportFiltersProps) {
  const active = isMonthlyReportFiltered(value);
  const allSourceIds = sources.map((source) => source.sourceId);
  const selectedSourceIds = value.sourceIds ?? allSourceIds;

  const toggleSource = (sourceId: string, checked: boolean) => {
    const next = checked
      ? [...new Set([...selectedSourceIds, sourceId])]
      : selectedSourceIds.filter((id) => id !== sourceId);
    onChange({
      sourceIds: next.length === allSourceIds.length ? null : next,
    });
  };

  return (
    <section
      className="rounded-xl border border-warm-200 bg-surface p-4 shadow-sm"
      aria-labelledby="monthly-report-filters-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <WalletCards className="size-4" aria-hidden />
          </span>
          <div>
            <h2
              id="monthly-report-filters-title"
              className="font-display text-sm font-semibold text-warm-900"
            >
              Lọc theo nguồn tiền
            </h2>
            <p className="mt-0.5 text-xs text-warm-500">
              Báo cáo luôn tải toàn bộ tháng. Có thể chọn một hoặc nhiều nguồn chi.
            </p>
          </div>
        </div>
        {active ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            leftIcon={<RotateCcw className="size-3.5" aria-hidden />}
            onClick={() => onChange(defaultMonthlyReportFilters())}
          >
            Chọn tất cả
          </Button>
        ) : null}
      </div>

      {sources.length === 0 ? (
        <p className="mt-4 text-sm text-warm-500">
          Tháng này chưa có nguồn tiền phát sinh chi tiêu.
        </p>
      ) : (
        <fieldset className="mt-4 flex flex-wrap gap-2">
          <legend className="sr-only">Chọn các nguồn tiền muốn hiển thị</legend>
          {sources.map((source) => {
            const checked = selectedSourceIds.includes(source.sourceId);
            return (
              <label
                key={source.sourceId}
                className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-warm-200 bg-warm-50/70 px-3 text-sm text-warm-800 transition hover:border-warm-300 has-[:checked]:border-accent/40 has-[:checked]:bg-accent/5"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) =>
                    toggleSource(source.sourceId, event.target.checked)
                  }
                  className="size-4 rounded border-warm-300 accent-accent"
                />
                <span className="font-medium">{source.sourceName}</span>
              </label>
            );
          })}
        </fieldset>
      )}
    </section>
  );
}
