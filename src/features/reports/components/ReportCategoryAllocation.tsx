import { useMemo } from "react";

import { CategoryChart } from "@/features/dashboard/components/CategoryChart";
import type { CategoryBreakdown } from "@/features/dashboard/types";
import { Button } from "@/shared/components/ui/Button";
import { SkeletonText } from "@/shared/components/ui/Skeleton";

import type { MonthlyReport } from "../types";
import {
  buildFilteredCategoryBreakdown,
  type CategoryExpenseFilter,
} from "../utils/categoryBreakdownFilter";
import { mapReportCategoriesToChart } from "../utils/mapReportCategories";

const FILTER_OPTIONS: { value: CategoryExpenseFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "transactions", label: "Giao dịch" },
  { value: "installments", label: "Trả góp" },
];

type ReportCategoryAllocationProps = {
  report: MonthlyReport | undefined;
  isLoading: boolean;
  filter: CategoryExpenseFilter;
  onFilterChange: (filter: CategoryExpenseFilter) => void;
};

export function ReportCategoryAllocation({
  report,
  isLoading,
  filter,
  onFilterChange,
}: ReportCategoryAllocationProps) {
  const chartData: CategoryBreakdown[] | undefined = useMemo(() => {
    if (!report) return undefined;
    const filtered = buildFilteredCategoryBreakdown(report, filter);
    return mapReportCategoriesToChart(filtered);
  }, [report, filter]);

  if (isLoading || report === undefined) {
    return (
      <article className="rounded-lg border border-warm-200 bg-surface p-5 shadow-sm">
        <SkeletonText className="mb-4 h-5 w-48" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
          <SkeletonText className="h-[280px] rounded-full sm:h-[300px] lg:col-span-7 lg:h-[320px]" />
          <div className="flex flex-col gap-1.5 lg:col-span-3">
            {Array.from({ length: 5 }, (_, i) => (
              <SkeletonText key={i} className="h-6" />
            ))}
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="rounded-lg border border-warm-200 bg-surface shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-warm-100 px-5 py-4">
        <div>
          <h3 className="font-display text-base font-semibold text-warm-900">
            Phân bổ chi tiêu
          </h3>
          <p className="mt-1 text-sm text-warm-500">
            Theo danh mục · mặc định giao dịch (trực tiếp + quẹt thẻ)
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1 rounded-lg border border-warm-200 bg-warm-50/80 p-1">
          {FILTER_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              type="button"
              variant={filter === opt.value ? "primary" : "ghost"}
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => onFilterChange(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="p-5 pt-2">
        <CategoryChart
          data={chartData}
          isLoading={false}
          embedded
          emptyMessage={
            filter === "installments"
              ? "Không có chi trả góp theo danh mục trong tháng"
              : filter === "transactions"
                ? "Không có giao dịch chi theo danh mục trong tháng"
                : "Không có dữ liệu chi trong tháng"
          }
        />
      </div>
    </div>
  );
}
