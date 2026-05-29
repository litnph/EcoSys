import { CreditCard, Search } from "lucide-react";
import { motion } from "framer-motion";
import * as React from "react";

import { EmptyState } from "@/shared/components/ui/EmptyState";
import { SkeletonCard } from "@/shared/components/ui/Skeleton";
import { cn } from "@/shared/lib/utils";
import { listStaggerItemMotion, listStaggerMotion } from "@/shared/lib/animations";

import type {
  InstallmentPlanListItem,
  InstallmentStatus,
} from "../types";
import type { FinSource } from "@/features/sources/types";

import { InstallmentPlanCard } from "./InstallmentPlanCard";

const tabTriggerClass = cn(
  "shrink-0 rounded-md px-3 py-2 font-medium transition outline-none whitespace-nowrap",
  "data-[state=active]:bg-surface data-[state=active]:text-warm-900 data-[state=active]:shadow-sm",
  "data-[state=inactive]:text-warm-500 hover:text-warm-800");

const selectClass = cn(
  "rounded-input border border-warm-200 bg-surface px-3 py-2 text-sm text-warm-900",
  "outline-none focus-visible:ring-2 focus-visible:ring-accent");

export interface InstallmentPlanListPanelProps {
  items: InstallmentPlanListItem[] | undefined;
  sources: FinSource[] | undefined;
  status: InstallmentStatus;
  onStatusChange: (status: InstallmentStatus) => void;
  isLoading?: boolean;
  onOpenDetail: (id: string) => void;
  onDelete?: (id: string) => void;
}

function pickCurrency(
  item: InstallmentPlanListItem,
  sources: FinSource[] | undefined): string {
  return sources?.find((s) => s.id === item.sourceId)?.currency ?? "VND";
}

function planSearchText(item: InstallmentPlanListItem): string {
  return [
    item.originalTxnCategoryName,
    item.originalTxnDescription,
    item.sourceName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function InstallmentPlanListPanel({
  items,
  sources,
  status,
  onStatusChange,
  isLoading,
  onOpenDetail,
  onDelete,
}: InstallmentPlanListPanelProps) {
  const [sourceFilter, setSourceFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");

  const creditSources = React.useMemo(
    () =>
      (sources ?? [])
        .filter((s) => s.type === "creditCard")
        .sort((a, b) => a.name.localeCompare(b.name, "vi")),
    [sources]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return (items ?? []).filter((item) => {
      if (sourceFilter !== "all" && item.sourceId !== sourceFilter) {
        return false;
      }
      if (q.length > 0 && !planSearchText(item).includes(q)) {
        return false;
      }
      return true;
    });
  }, [items, sourceFilter, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-card border border-warm-200 bg-surface p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Trạng thái kế hoạch">
          {(
            [
              ["active", "Đang trả"],
              ["completed", "Hoàn tất"],
              ["cancelled", "Đã hủy"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={status === value}
              className={cn(
                tabTriggerClass,
                status === value
                  ? "bg-surface text-warm-900 shadow-sm"
                  : "text-warm-500 hover:text-warm-800")}
              onClick={() => onStatusChange(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="flex min-w-[160px] flex-1 flex-col gap-1 text-xs text-warm-500 sm:max-w-[200px]">
          Thẻ
          <select
            className={selectClass}
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="all">Tất cả thẻ</option>
            {creditSources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.icon ? `${s.icon} ` : ""}
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="relative flex min-w-[200px] flex-1 flex-col gap-1 text-xs text-warm-500">
          Tìm kiếm
          <span className="relative block">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-warm-400"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Danh mục, mô tả, thẻ…"
              className={cn(
                selectClass,
                "w-full ps-9")}
            />
          </span>
        </label>

        <p className="text-sm text-warm-500 sm:ms-auto sm:pb-2">
          <span className="font-medium text-warm-900">{filtered.length}</span> kế
          hoạch
        </p>
      </div>

      <motion.div
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        {...listStaggerMotion}
      >
        {isLoading ? (
          <>
            <motion.div {...listStaggerItemMotion}>
              <SkeletonCard />
            </motion.div>
            <motion.div {...listStaggerItemMotion}>
              <SkeletonCard />
            </motion.div>
            <motion.div {...listStaggerItemMotion}>
              <SkeletonCard />
            </motion.div>
          </>
        ) : filtered.length === 0 ? (
          <div className="sm:col-span-2 xl:col-span-3">
            <EmptyState
              icon={<CreditCard aria-hidden className="size-14" />}
              title="Không có kế hoạch"
              description={
                search.trim() || sourceFilter !== "all"
                  ? "Thử đổi bộ lọc hoặc từ khóa tìm kiếm."
                  : "Khi có giao dịch deferred trên thẻ tín dụng, bạn có thể tạo trả góp mới."
              }
            />
          </div>
        ) : (
          filtered.map((item) => (
            <motion.div key={item.id} {...listStaggerItemMotion}>
              <InstallmentPlanCard
                listItem={item}
                currency={pickCurrency(item, sources)}
                onOpenDetail={() => onOpenDetail(item.id)}
                onDelete={
                  item.canDelete ? () => onDelete?.(item.id) : undefined
                }
              />
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}
