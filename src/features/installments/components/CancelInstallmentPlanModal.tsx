import * as React from "react";

import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Modal } from "@/shared/components/ui/Modal";

import { useCancelInstallmentPlan } from "../hooks/useCancelInstallmentPlan";

export interface CancelInstallmentPlanModalProps {
  planId: string | null;
  expectedVersion: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CancelInstallmentPlanModal({
  planId,
  expectedVersion,
  isOpen,
  onClose,
}: CancelInstallmentPlanModalProps) {
  const cancelM = useCancelInstallmentPlan();
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (!isOpen) setReason("");
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planId || expectedVersion === null) return;
    try {
      await cancelM.mutateAsync({
        id: planId,
        reason: reason.trim() || undefined,
        expectedVersion,
      });
      onClose();
    } catch {
      /* toast */
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hủy kế hoạch trả góp"
      description="Các kỳ chưa trả sẽ bị hủy. Thao tác không hoàn tác."
      size="md"
    >
      <form className="flex flex-col gap-4" onSubmit={(ev) => void handleSubmit(ev)}>
        <Input
          label="Lý do (tuỳ chọn)"
          value={reason}
          onChange={(ev) => setReason(ev.target.value)}
          placeholder="Ví dụ: trả một lần thay trả góp"
          disabled={cancelM.isPending}
        />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Đóng
          </Button>
          <Button
            type="submit"
            variant="secondary"
            isLoading={cancelM.isPending}
            disabled={!planId}
          >
            Xác nhận hủy
          </Button>
        </div>
      </form>
    </Modal>
  );
}
