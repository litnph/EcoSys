import { AlertTriangle } from "lucide-react";

import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";
import { cn } from "@/shared/lib/utils";

import { useDeleteMonthlyReport } from "../hooks/useDeleteMonthlyReport";
import type { MonthlyPeriodStatus } from "../types";

export interface DeleteMonthlyReportModalProps {
  year: number;
  month: number;
  status: MonthlyPeriodStatus;
  open: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

export function DeleteMonthlyReportModal({
  year,
  month,
  status,
  open,
  onClose,
  onDeleted,
}: DeleteMonthlyReportModalProps) {
  const deleteM = useDeleteMonthlyReport();
  const isClosed = status === "closed";

  const handleConfirm = async () => {
    try {
      await deleteM.mutateAsync({ year, month });
      onDeleted?.();
      onClose();
    } catch {
      /* toast in hook */
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Xóa báo cáo tháng?"
      description={`Báo cáo tháng ${month}/${year} sẽ bị xóa vĩnh viễn.`}
      size="sm"
    >
      <div className="flex flex-col gap-4">
        <div
          className={cn(
            "flex gap-3 rounded-button border border-warning/35 bg-warning/10 p-3 text-sm text-warm-800",
          )}
          role="alert"
        >
          <AlertTriangle
            className="mt-0.5 size-5 shrink-0 text-warning"
            aria-hidden
          />
          <p>
            {isClosed
              ? "Báo cáo đã chốt sẽ bị xóa và các giao dịch trong tháng được mở khóa chỉnh sửa trở lại."
              : "Toàn bộ snapshot và tổng hợp của báo cáo này sẽ bị xóa. Bạn có thể tạo lại sau."}
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="button"
            variant="danger"
            isLoading={deleteM.isPending}
            onClick={() => void handleConfirm()}
          >
            Xóa báo cáo
          </Button>
        </div>
      </div>
    </Modal>
  );
}
