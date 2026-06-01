import { BarChart2, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { formatCurrency, formatRelativeTime } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";

import type { MonthlyPeriodListItem } from "../types";
import { currentUtcYearMonth } from "../utils/months";

import { CreateMonthlyReportModal } from "./CreateMonthlyReportModal";

export interface MonthlyReportListPanelProps {
  items: MonthlyPeriodListItem[] | undefined;
  isLoading: boolean;
  onOpen: (item: MonthlyPeriodListItem) => void;
}

function monthLabel(year: number, month: number): string {
  return `Tháng ${String(month)}/${String(year)}`;
}

function statusBadge(status: MonthlyPeriodListItem["status"]) {
  if (status === "closed") {
    return (
      <Badge variant="success" size="sm">
        Đã chốt
      </Badge>
    );
  }
  return (
    <Badge variant="info" size="sm">
      Đang mở
    </Badge>
  );
}

export function MonthlyReportListPanel({
  items,
  isLoading,
  onOpen,
}: MonthlyReportListPanelProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const now = currentUtcYearMonth();

  const existingKeys = useMemo(
    () => new Set((items ?? []).map((p) => `${p.year}-${p.month}`)),
    [items],
  );

  return (
    <>
      <div className="mt-8 flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-warm-600">
            Mỗi báo cáo tổng hợp chi tiêu giao dịch, trả góp và thu nhập của một tháng.
          </p>
          <Button
            type="button"
            leftIcon={<Plus className="size-4" aria-hidden />}
            onClick={() => setCreateOpen(true)}
          >
            Tạo báo cáo tháng
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-card border border-warm-100 bg-warm-50/70"
              />
            ))}
          </div>
        ) : !items?.length ? (
          <EmptyState
            icon={<BarChart2 aria-hidden />}
            title="Chưa có báo cáo tháng nào"
            description="Nhấn “Tạo báo cáo tháng” để bắt đầu tổng hợp dữ liệu cho tháng bạn chọn."
            action={{
              label: "Tạo báo cáo tháng",
              onClick: () => setCreateOpen(true),
            }}
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <li key={`${item.year}-${item.month}`}>
                <button
                  type="button"
                  className={cn(
                    "flex h-full w-full flex-col gap-3 rounded-card border border-warm-200 bg-surface p-4 text-left shadow-sm transition",
                    "hover:border-accent/40 hover:bg-warm-25/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  )}
                  onClick={() => onOpen(item)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-display text-base font-semibold text-warm-900">
                      {monthLabel(item.year, item.month)}
                    </h2>
                    {statusBadge(item.status)}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-warm-500">Thu</p>
                      <p className="font-mono font-semibold tabular-nums text-success">
                        {formatCurrency(item.totalIncome)}
                      </p>
                    </div>
                    <div>
                      <p className="text-warm-500">Tổng chi</p>
                      <p className="font-mono font-semibold tabular-nums text-danger">
                        {formatCurrency(item.totalExpense)}
                      </p>
                    </div>
                    <div>
                      <p className="text-warm-500">Còn lại</p>
                      <p
                        className={cn(
                          "font-mono font-semibold tabular-nums",
                          item.net >= 0 ? "text-accent" : "text-danger",
                        )}
                      >
                        {formatCurrency(item.net)}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-warm-500">
                    {item.lastRefreshedAt
                      ? `Cập nhật ${formatRelativeTime(item.lastRefreshedAt)}`
                      : `Tạo ${formatRelativeTime(item.reportCreatedAt)}`}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CreateMonthlyReportModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        existingKeys={existingKeys}
        defaultYear={now.year}
        defaultMonth={now.month}
        onCreated={(year, month) => {
          setCreateOpen(false);
          onOpen({
            year,
            month,
            status: "open",
            totalIncome: 0,
            totalExpense: 0,
            net: 0,
            reportCreatedAt: new Date().toISOString(),
            lastRefreshedAt: new Date().toISOString(),
            closedAt: null,
          });
        }}
      />
    </>
  );
}
