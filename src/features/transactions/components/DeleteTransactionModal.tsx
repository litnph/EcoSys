import type { UseMutationResult } from "@tanstack/react-query";
import * as React from "react";

import type { DeleteTransactionVariables } from "../hooks/useDeleteTransaction";

import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Modal } from "@/shared/components/ui/Modal";

export interface DeleteTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string | null;
  expectedVersion?: number;
  mutation: UseMutationResult<
    string,
    unknown,
    DeleteTransactionVariables,
    unknown
  >;
  onDeleted?: () => void;
}

export function DeleteTransactionModal({
  isOpen,
  onClose,
  transactionId,
  expectedVersion,
  mutation,
  onDeleted,
}: DeleteTransactionModalProps) {
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (!isOpen) setReason("");
  }, [isOpen]);

  const handleClose = React.useCallback(() => {
    if (mutation.isPending) return;
    onClose();
  }, [mutation.isPending, onClose]);

  const handleConfirm = React.useCallback(() => {
    if (!transactionId || mutation.isPending) return;
    const trimmed = reason.trim();
    mutation.mutate(
      {
        id: transactionId,
        reason: trimmed.length > 0 ? trimmed : undefined,
        expectedVersion,
      },
      {
        onSuccess: () => {
          onClose();
          onDeleted?.();
        },
      });
  }, [transactionId, expectedVersion, reason, mutation, onClose, onDeleted]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Xóa giao dịch"
      description="Hành động này không hoàn tác qua giao diện. Kiểm tra kỹ trước khi xác nhận."
      size="sm"
    >
      <div className="space-y-4">
        <div
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950"
          role="alert"
        >
          Giao dịch sẽ bị xóa và số dư tài khoản sẽ được hoàn lại tự động
        </div>

        <Input
          label="Lý do (tuỳ chọn)"
          placeholder="Ví dụ: nhập nhầm, trùng bút toán…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={mutation.isPending}
        />

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={mutation.isPending}
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="danger"
            isLoading={mutation.isPending}
            onClick={handleConfirm}
          >
            Xóa
          </Button>
        </div>
      </div>
    </Modal>
  );
}
