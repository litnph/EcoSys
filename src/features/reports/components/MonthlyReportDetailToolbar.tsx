import { ArrowLeft, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { formatRelativeTime } from "@/shared/lib/formatters";

import { useRefreshMonthlyReport } from "../hooks/useRefreshMonthlyReport";
import type { MonthlyPeriodListItem, MonthlyReport } from "../types";

import { DeleteMonthlyReportModal } from "./DeleteMonthlyReportModal";

export interface MonthlyReportDetailToolbarProps {
  year: number;
  month: number;
  status: MonthlyReport["status"];
  lastRefreshedAt?: string | null;
  onBack: () => void;
  onDeleted?: () => void;
}

export function MonthlyReportDetailToolbar({
  year,
  month,
  status,
  lastRefreshedAt,
  onBack,
  onDeleted,
}: MonthlyReportDetailToolbarProps) {
  const refreshM = useRefreshMonthlyReport();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const isClosed = status === "closed";

  return (
    <>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="size-4" aria-hidden />}
          onClick={onBack}
        >
          Danh sách báo cáo
        </Button>
        <h2 className="font-display text-lg font-semibold text-warm-900">
          Báo cáo tháng {month}/{year}
        </h2>
        {isClosed ? (
          <Badge variant="success" size="md">
            Đã chốt
          </Badge>
        ) : (
          <Badge variant="info" size="md">
            Đang mở
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {lastRefreshedAt ? (
          <p className="text-xs text-warm-500">
            Cập nhật lần cuối: {formatRelativeTime(lastRefreshedAt)}
          </p>
        ) : null}
        {!isClosed ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            isLoading={refreshM.isPending}
            leftIcon={<RefreshCw className="size-4" aria-hidden />}
            onClick={() =>
              void refreshM.mutateAsync({ year, month })
            }
          >
            Cập nhật báo cáo
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-11 shrink-0 px-0 text-warm-500 hover:text-danger sm:size-8"
          aria-label="Xóa báo cáo tháng"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </div>
    </div>

      <DeleteMonthlyReportModal
        year={year}
        month={month}
        status={status}
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onDeleted={onDeleted}
      />
    </>
  );
}

export type { MonthlyPeriodListItem };
