"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";
import { SkeletonText } from "@/shared/components/ui/Skeleton";
import { cn } from "@/shared/lib/utils";

import { useDeleteSource } from "../hooks/useDeleteSource";
import { useSourceTransactionCount } from "../hooks/useSourceTransactionCount";
import type { FinSource } from "../types";

export type DeleteSourceConfirmProps = {
  source: FinSource | null;
  isOpen: boolean;
  onClose: () => void;
};

export function DeleteSourceConfirm({
  source,
  isOpen,
  onClose,
}: DeleteSourceConfirmProps) {
  const deleteM = useDeleteSource();
  const countQ = useSourceTransactionCount(
    source?.id,
    isOpen && source != null);

  const txnCount = countQ.data ?? 0;
  const showTxnWarning = txnCount > 0;

  const handleDelete = async () => {
    if (!source) return;
    try {
      await deleteM.mutateAsync({ id: source.id });
      onClose();
    } catch {
      /* toast handled in hook */
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Xóa nguồn tài chính?"
      description={
        source
          ? `Nguồn “${source.name}” sẽ bị xóa vĩnh viễn nếu không còn giao dịch liên quan.`
          : undefined
      }
      size="sm"
    >
      <div className="flex flex-col gap-4">
        {countQ.isLoading ? (
          <SkeletonText className="h-4 w-4/5" />
        ) : showTxnWarning ? (
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
              Nguồn này có{" "}
              <strong className="font-mono">{txnCount}</strong> giao dịch (theo
              bộ lọc nguồn gửi). Backend có thể từ chối nếu vẫn còn chứng từ liên
              quan (kể cả chuyển khoản).
            </p>
          </div>
        ) : (
          <p className="text-sm text-warm-600">
            Bạn có chắc chắn muốn xóa? Hành động này không thể hoàn tác.
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={deleteM.isPending}
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="danger"
            isLoading={deleteM.isPending}
            onClick={() => void handleDelete()}
            disabled={!source}
          >
            Xóa nguồn
          </Button>
        </div>
      </div>
    </Modal>
  );
}
