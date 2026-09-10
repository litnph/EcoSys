import { useMemo, useState } from "react";

import { useFlatCategories } from "@/features/categories/hooks/useFlatCategories";
import { CategoryChart } from "@/features/dashboard/components/CategoryChart";
import type {
  CategoryBreakdown,
  CategoryRollupLevel,
} from "@/features/dashboard/types";
import { AsyncStateError } from "@/shared/components/ui/AsyncStateError";
import { Button } from "@/shared/components/ui/Button";
import { SkeletonText } from "@/shared/components/ui/Skeleton";

import type { MonthlyReport } from "../types";
import type { CategoryExpenseFilter } from "../utils/categoryBreakdownFilter";
import { buildReportCategoryAllocation } from "../utils/buildReportCategoryAllocation";
import { mapReportCategoriesToChart } from "../utils/mapReportCategories";

const FILTER_OPTIONS: { value: CategoryExpenseFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "transactions", label: "Giao dịch" },
  { value: "installments", label: "Trả góp" },
];

const LEVEL_OPTIONS: { value: CategoryRollupLevel; label: string }[] = [
  { value: "parent", label: "Danh mục cha" },
  { value: "child", label: "Danh mục con" },
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
  const [level, setLevel] = useState<CategoryRollupLevel>("parent");
  const categoriesQ = useFlatCategories("expense");
  const chartData: CategoryBreakdown[] | undefined = useMemo(() => {
    if (!report || !categoriesQ.data) return undefined;
    const filtered = buildReportCategoryAllocation(
      report,
      filter,
      categoriesQ.data,
      level,
    );
    return mapReportCategoriesToChart(filtered);
  }, [categoriesQ.data, filter, level, report]);

  if (isLoading || report === undefined || categoriesQ.isLoading) {
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

  if (categoriesQ.isError) {
    return (
      <AsyncStateError
        title="Không tải được danh mục cho biểu đồ"
        description="Vui lòng thử lại để phân bổ chi tiêu theo danh mục cha hoặc danh mục con."
        onRetry={() => void categoriesQ.refetch()}
      />
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
            Theo danh mục · tích chọn từng danh mục trong chú thích để ẩn hoặc hiện
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-1 rounded-lg border border-warm-200 bg-warm-50/80 p-1">
            {FILTER_OPTIONS.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={filter === option.value ? "primary" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => onFilterChange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 rounded-lg border border-warm-200 bg-warm-50/80 p-1">
            {LEVEL_OPTIONS.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={level === option.value ? "primary" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => setLevel(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
      <div className="p-5 pt-2">
        <CategoryChart
          key={`${String(report.year)}-${String(report.month)}-${report.metadata?.currency ?? "VND"}-${filter}-${level}`}
          data={chartData}
          isLoading={false}
          embedded
          selectableCategories
          currency={report.metadata?.currency ?? "VND"}
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
