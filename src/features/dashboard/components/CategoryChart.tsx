import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { SkeletonText } from "@/shared/components/ui/Skeleton";
import { formatCurrency, formatPercentage } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";

import type { CategoryBreakdown } from "../types";

type SliceRow = CategoryBreakdown & { value: number };

type CategoryChartProps = {
  data: CategoryBreakdown[] | undefined;
  isLoading: boolean;
  /** Omit outer card + title (e.g. report page with custom header). */
  embedded?: boolean;
  emptyMessage?: string;
  currency?: string;
  /** Adds a checkbox to every legend category so slices can be hidden independently. */
  selectableCategories?: boolean;
};

type CategoryTooltipProps = {
  active?: boolean;
  payload?: ReadonlyArray<{ payload: SliceRow }>;
  currency: string;
};

function CategoryTooltip({ active, payload, currency }: CategoryTooltipProps) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;

  return (
    <div className="rounded-lg border border-warm-200 bg-surface px-3 py-2 shadow-md">
      <p className="text-sm font-medium text-warm-900">{row.categoryName}</p>
      <p className="font-mono text-sm text-accent">
        {formatCurrency(row.amount, currency)}{" "}
        <span className="text-warm-500">
          ({formatPercentage(row.percentage)})
        </span>
      </p>
    </div>
  );
}

function CategoryLegend({
  allRows,
  visibleRows,
  currency,
  selectable,
  onVisibilityChange,
}: {
  allRows: SliceRow[];
  visibleRows: SliceRow[];
  currency: string;
  selectable: boolean;
  onVisibilityChange: (categoryId: string, visible: boolean) => void;
}) {
  const visibleById = new Map(visibleRows.map((row) => [row.categoryId, row]));

  return (
    <ul className="flex min-w-0 flex-col gap-1 overflow-y-auto lg:col-span-3 lg:max-h-[320px] lg:pr-1">
      {allRows.map((row) => {
        const visibleRow = visibleById.get(row.categoryId);
        const visible = Boolean(visibleRow);
        return (
          <li key={row.categoryId}>
            <label
              className={cn(
                "flex min-h-9 items-center gap-2 rounded-md px-1.5 py-1 text-sm transition",
                selectable && "cursor-pointer hover:bg-warm-50",
                !visible && "text-warm-400",
              )}
            >
              {selectable ? (
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={(event) =>
                    onVisibilityChange(row.categoryId, event.target.checked)
                  }
                  className="size-4 shrink-0 rounded border-warm-300 accent-accent"
                  aria-label={`${visible ? "Ẩn" : "Hiện"} danh mục ${row.categoryName}`}
                />
              ) : null}
              <span
                className="size-2 shrink-0 rounded-sm"
                style={{ backgroundColor: row.color }}
                aria-hidden
              />
              <span
                className={cn(
                  "min-w-0 flex-1 truncate font-medium",
                  visible ? "text-warm-900" : "text-warm-400 line-through",
                )}
              >
                {row.categoryName}
              </span>
              <span
                className={cn(
                  "shrink-0 font-mono text-xs tabular-nums",
                  visible ? "text-warm-500" : "text-warm-300",
                )}
              >
                {formatCurrency(row.amount, currency)}
              </span>
              <span
                className={cn(
                  "w-12 shrink-0 text-right font-mono text-xs font-semibold tabular-nums",
                  visible ? "text-warm-900" : "text-warm-300",
                )}
              >
                {visibleRow ? formatPercentage(visibleRow.percentage) : "—"}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

function CategoryChartBody({
  allRows,
  visibleRows,
  emptyMessage,
  currency,
  selectable,
  onVisibilityChange,
}: {
  allRows: SliceRow[];
  visibleRows: SliceRow[];
  emptyMessage: string;
  currency: string;
  selectable: boolean;
  onVisibilityChange: (categoryId: string, visible: boolean) => void;
}) {
  const total = visibleRows.reduce((sum, row) => sum + row.value, 0);

  if (allRows.length === 0 || allRows.every((row) => row.value <= 0)) {
    return (
      <p className="flex min-h-[200px] flex-1 items-center justify-center py-12 text-sm text-warm-400">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-10 lg:items-center lg:gap-6">
      <div className="relative mx-auto h-[280px] w-full min-w-0 sm:h-[300px] lg:col-span-7 lg:mx-0 lg:h-[320px]" role="img" aria-label="Biểu đồ phân bổ chi tiêu theo danh mục; chi tiết được liệt kê bên cạnh">
        {visibleRows.length === 0 ? (
          <p className="flex h-full items-center justify-center px-6 text-center text-sm text-warm-400">
            Chọn ít nhất một danh mục để hiển thị biểu đồ.
          </p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart accessibilityLayer>
                <Pie
                  data={visibleRows}
                  dataKey="value"
                  nameKey="categoryName"
                  cx="50%"
                  cy="50%"
                  innerRadius="50%"
                  outerRadius="85%"
                  paddingAngle={2}
                  stroke="none"
                  isAnimationActive={false}
                >
                  {visibleRows.map((entry) => (
                    <Cell key={entry.categoryId} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CategoryTooltip currency={currency} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[10px] font-medium uppercase tracking-wide text-warm-400">
                Tổng chi
              </p>
              <p className="font-display text-sm font-semibold tabular-nums text-warm-900">
                {formatCurrency(total, currency)}
              </p>
            </div>
          </>
        )}
      </div>

      <CategoryLegend
        allRows={allRows}
        visibleRows={visibleRows}
        currency={currency}
        selectable={selectable}
        onVisibilityChange={onVisibilityChange}
      />
    </div>
  );
}

export function CategoryChart({
  data,
  isLoading,
  embedded = false,
  currency = "VND",
  emptyMessage = "Không có dữ liệu chi tiêu",
  selectableCategories = false,
}: CategoryChartProps) {
  const [hiddenCategoryIds, setHiddenCategoryIds] = useState<Set<string>>(
    () => new Set(),
  );
  const shellClass = cn(
    "flex h-full min-h-[320px] flex-col",
    !embedded && "rounded-lg border border-warm-200 bg-surface p-5 shadow-sm",
  );

  const allRows = useMemo<SliceRow[]>(
    () =>
      (data ?? []).map((item) => ({
        ...item,
        value: item.amount,
      })),
    [data],
  );
  const visibleRows = useMemo(() => {
    const rows = selectableCategories
      ? allRows.filter((row) => !hiddenCategoryIds.has(row.categoryId))
      : allRows;
    const total = rows.reduce((sum, row) => sum + row.amount, 0);
    return rows.map((row) => ({
      ...row,
      percentage:
        total > 0 ? Math.round((row.amount / total) * 10_000) / 100 : 0,
    }));
  }, [allRows, hiddenCategoryIds, selectableCategories]);

  if (isLoading || data === undefined) {
    return (
      <article className={shellClass}>
        {!embedded ? (
          <>
            <SkeletonText className="mb-2 h-5 w-40" />
            <SkeletonText className="mb-5 h-4 w-32" />
          </>
        ) : null}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
          <SkeletonText className="mx-auto h-[280px] rounded-full sm:h-[300px] lg:col-span-7 lg:mx-0 lg:h-[320px]" />
          <div className="flex flex-col gap-1.5 lg:col-span-3">
            {Array.from({ length: 5 }, (_, i) => (
              <SkeletonText key={i} className="h-6 w-full" />
            ))}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={shellClass}>
      {!embedded ? (
        <header className="mb-4">
          <h3 className="font-display text-base font-semibold text-warm-900">
            Phân bổ chi tiêu
          </h3>
          <p className="mt-1 text-sm text-warm-500">Theo danh mục tháng này</p>
        </header>
      ) : null}

      <CategoryChartBody
        allRows={allRows}
        visibleRows={visibleRows}
        emptyMessage={emptyMessage}
        currency={currency}
        selectable={selectableCategories}
        onVisibilityChange={(categoryId, visible) => {
          setHiddenCategoryIds((current) => {
            const next = new Set(current);
            if (visible) next.delete(categoryId);
            else next.add(categoryId);
            return next;
          });
        }}
      />
    </article>
  );
}
