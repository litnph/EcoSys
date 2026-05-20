"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";
import { cn } from "@/shared/lib/utils";

import { useCloseCycle } from "../hooks/useCloseCycle";
import type { BillingCycle } from "../types";

export interface CloseCycleModalProps {
  cycle: BillingCycle | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CloseCycleModal({
  cycle,
  isOpen,
  onClose,
}: CloseCycleModalProps) {
  const closeM = useCloseCycle();

  const handleConfirm = async () => {
    if (!cycle) return;
    try {
      await closeM.mutateAsync(cycle.id);
      onClose();
    } catch {
      /* toast in hook */
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Đóng kỳ sao kê?"
      description={
        cycle
          ? `Kỳ ${cycle.sourceName} sẽ chốt số dư và không nhận thêm giao dịch hoãn thanh toán.`
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
          <p>
            Sau khi đóng,{" "}
            <strong>không thể thêm giao dịch</strong> vào kỳ này.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="button"
            variant="danger"
            isLoading={closeM.isPending}
            onClick={() => void handleConfirm()}
          >
            Đóng kỳ
          </Button>
        </div>
      </div>
    </Modal>
  );
}
