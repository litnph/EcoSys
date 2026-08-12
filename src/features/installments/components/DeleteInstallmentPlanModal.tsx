import { AlertTriangle } from "lucide-react";

import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";
import { cn } from "@/shared/lib/utils";

import { useInstallmentPlanDetail } from "../hooks/useInstallmentPlanDetail";
import { useDeleteInstallmentPlan } from "../hooks/useDeleteInstallmentPlan";

export interface DeleteInstallmentPlanModalProps {
  planId: string | null;
  planTitle?: string | null;
  expectedVersion: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteInstallmentPlanModal({
  planId,
  planTitle,
  expectedVersion,
  isOpen,
  onClose,
}: DeleteInstallmentPlanModalProps) {
  const deleteM = useDeleteInstallmentPlan();
  const detailQ = useInstallmentPlanDetail(planId, isOpen);

  const handleConfirm = async () => {
    if (!planId || expectedVersion === null) return;
    try {
      await deleteM.mutateAsync({
        id: planId,
        originalTxnId: detailQ.data?.originalTxnId,
        expectedVersion,
      });
      onClose();
    } catch {
      /* toast in hook */
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Xóa kế hoạch trả góp?"
      description={
        planTitle
          ? `${planTitle} — toàn bộ lịch kỳ sẽ bị gỡ.`
          : "Toàn bộ lịch kỳ sẽ bị gỡ khỏi hệ thống."
      }
      size="sm"
    >
      <div className="flex flex-col gap-4">
        <div
          className={cn(
            "flex gap-3 rounded-button border border-warning/35 bg-warning/10 p-3 text-sm text-warm-800")}
          role="alert"
        >
          <AlertTriangle
            className="mt-0.5 size-5 shrink-0 text-warning"
            aria-hidden
          />
          <div className="space-y-2">
            <p>
              Kế hoạch đang hoạt động chỉ xóa được khi chưa ghi nhận thanh toán qua app và phí
              chuyển đổi chưa được billing. Kế hoạch đã hoàn thành vẫn có thể xóa để gỡ liên
              kết trả góp; các giao dịch thanh toán đã ghi vẫn được giữ lại.
            </p>
            <p>
              Nếu có kỳ đã backfill (đánh dấu đã trả theo lịch cũ), dư nợ thẻ tín dụng sẽ được
              cộng lại. Giao dịch gốc không bị xóa và có thể sửa số tiền trở lại.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="button"
            variant="danger"
            isLoading={deleteM.isPending}
            disabled={!planId}
            onClick={() => void handleConfirm()}
          >
            Xóa kế hoạch
          </Button>
        </div>
      </div>
    </Modal>
  );
}
