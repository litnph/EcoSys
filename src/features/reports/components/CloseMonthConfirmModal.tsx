"use client";

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
}

export function CloseMonthConfirmModal({
  year,
  month,
  open,
  onClose,
}: CloseMonthConfirmModalProps) {
  const closeM = useCloseMonth();

  const handleConfirm = async () => {
    try {
      await closeM.mutateAsync({
        year,
        month,
      });
      onClose();
    } catch {
      /* toast in hook */
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Chốt tháng?"
      description="Tổng thu chi và phân loại của tháng sẽ được đóng băng. Thao tác chỉ được phép sau khi tất cả kỳ sao kê thẻ của tháng đã được xử lý."
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
            Bạn <strong>không thể mở lại</strong> tháng sau khi chốt. Hãy chắc chắn số liệu đã đầy đủ.
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
            Chốt tháng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
