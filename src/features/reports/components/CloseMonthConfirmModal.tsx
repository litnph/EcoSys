import { AlertTriangle } from "lucide-react";

import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";
import { cn } from "@/shared/lib/utils";

import { useCloseMonth } from "../hooks/useCloseMonth";

export interface CloseMonthConfirmModalProps {
  year: number;
  month: number;
  open: boolean;
  onClose: () => void;
  onClosed?: () => void;
}

export function CloseMonthConfirmModal({
  year,
  month,
  open,
  onClose,
  onClosed,
}: CloseMonthConfirmModalProps) {
  const closeM = useCloseMonth();

  const handleConfirm = async () => {
    try {
      await closeM.mutateAsync({
        year,
        month,
      });
      onClose();
      onClosed?.();
    } catch {
      /* toast in hook */
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Chốt báo cáo tháng?"
      description="Báo cáo sẽ được đóng băng sau khi chốt. Chỉ thực hiện khi tất cả kỳ sao kê thẻ của tháng đã được xử lý."
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
          <p>
            Bạn <strong>không thể cập nhật</strong> báo cáo sau khi chốt. Hãy chắc chắn số liệu đã đầy đủ.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="button"
            variant="primary"
            isLoading={closeM.isPending}
            onClick={() => void handleConfirm()}
          >
            Chốt báo cáo
          </Button>
        </div>
      </div>
    </Modal>
  );
}
