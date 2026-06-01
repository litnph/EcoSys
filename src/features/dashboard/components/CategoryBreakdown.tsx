import { SkeletonText } from "@/shared/components/ui/Skeleton";
import { formatCurrency, formatPercentage } from "@/shared/lib/formatters";

import type { CategoryBreakdown as CategoryBreakdownRow } from "../types";

type CategoryBreakdownProps = {
  data: CategoryBreakdownRow[] | undefined;
  isLoading: boolean;
};

export function CategoryBreakdown({
  data,
  isLoading,
}: CategoryBreakdownProps) {
  if (isLoading || data === undefined) {
    return (
      <article className="flex h-full flex-col rounded-lg border border-warm-200 bg-surface p-5 shadow-sm">
        <SkeletonText className="mb-4 h-5 w-48" />
        {Array.from({ length: 5 }, (_, i) => (
          <SkeletonText key={i} className="mb-4 h-10 w-full" />
        ))}
      </article>
    );
  }

  const sorted = [...data]
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const maxPct = sorted.reduce(
    (max, row) => Math.max(max, row.percentage),
    0,
  );

  return (
    <article className="flex h-full flex-col rounded-lg border border-warm-200 bg-surface p-5 shadow-sm">
      <header className="mb-4">
        <h3 className="font-display text-base font-semibold text-warm-900">
          Danh mục chi nhiều nhất
        </h3>
        <p className="mt-1 text-sm text-warm-500">
          Tỷ trọng trong tổng chi tháng
        </p>
      </header>

      {sorted.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-sm text-warm-400">
          Không có chi tiêu theo danh mục
        </p>
      ) : (
        <ul className="flex flex-1 flex-col gap-4">
          {sorted.map((cat) => {
            const barWidth =
              maxPct > 0
                ? Math.min(100, Math.round((cat.percentage / maxPct) * 100))
                : 0;

            return (
              <li key={cat.categoryId}>
                <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-warm-800">
                    {cat.categoryName}
                  </span>
                  <span className="shrink-0 font-mono text-xs tabular-nums text-warm-600">
                    {formatCurrency(cat.amount)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-warm-100">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${String(barWidth)}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-warm-400">
                  {formatPercentage(cat.percentage)} tổng chi tháng
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
