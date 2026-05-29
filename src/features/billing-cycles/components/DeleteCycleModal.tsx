import { AlertTriangle } from "lucide-react";

import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";
import { cn } from "@/shared/lib/utils";

import { useDeleteCycle } from "../hooks/useDeleteCycle";
import type { BillingCycle } from "../types";
import { billingCycleDisplayName } from "../utils/billingCycleDisplay";

export interface DeleteCycleModalProps {
  cycle: BillingCycle | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

export function DeleteCycleModal({
  cycle,
  isOpen,
  onClose,
  onDeleted,
}: DeleteCycleModalProps) {
  const deleteM = useDeleteCycle();

  const handleConfirm = async () => {
    if (!cycle) return;
    try {
      await deleteM.mutateAsync(cycle.id);
      onDeleted?.();
      onClose();
    } catch {
      /* toast in hook */
    }
  };

  const label = cycle ? billingCycleDisplayName(cycle) : "";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Xóa kỳ sao kê?"
      description={
        cycle
          ? `${label} · ${cycle.sourceName} sẽ bị xóa cùng danh sách giao dịch trong kỳ.`
          : undefined
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
          <p>Chỉ xóa được kỳ đang mở và chưa có thanh toán.</p>
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
            Xóa kỳ
          </Button>
        </div>
      </div>
    </Modal>
  );
}
