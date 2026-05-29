import { AlertTriangle } from "lucide-react";

import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";
import { cn } from "@/shared/lib/utils";
import { formatCurrency } from "@/shared/lib/formatters";

import { useRecalculateSourceBalance } from "../hooks/useRecalculateSourceBalance";

export interface RecalculateSourceConfirmModalProps {
  sourceId: string;
  sourceName: string;
  currency: string;
  storedBalance: number;
  computedBalance: number;
  drift: number;
  creditLimit?: number | null;
  isOpen: boolean;
  onClose: () => void;
  onApplied?: () => void;
}

function utilizationPct(balance: number, limit: number | null | undefined): string {
  if (limit == null || limit <= 0) return "—";
  const pct = Math.round((balance / limit) * 1000) / 10;
  return `${String(pct)}%`;
}

export function RecalculateSourceConfirmModal({
  sourceId,
  sourceName,
  currency,
  storedBalance,
  computedBalance,
  drift,
  creditLimit,
  isOpen,
  onClose,
  onApplied,
}: RecalculateSourceConfirmModalProps) {
  const recalcM = useRecalculateSourceBalance(sourceId);

  const handleConfirm = async () => {
    try {
      await recalcM.mutateAsync();
      onApplied?.();
      onClose();
    } catch {
      /* toast in hook */
    }
  };

  const hasDrift = drift !== 0;
  const isCard = creditLimit != null && creditLimit > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Xác nhận đồng bộ số dư"
      description={sourceName}
      size="sm"
    >
      <div className="flex flex-col gap-4">
        {hasDrift ? (
          <div
            className="flex gap-2 rounded-button border border-warning/35 bg-warning/10 px-3 py-2 text-sm text-warm-800"
            role="alert"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
            <p>Số dư lưu và số tính lại khác nhau. Xác nhận để cập nhật.</p>
          </div>
        ) : (
          <p className="text-sm text-warm-600">
            Số dư đã khớp với giao dịch. Vẫn có thể chạy lại để đảm bảo.
          </p>
        )}

        <dl className="grid grid-cols-2 gap-3 rounded-lg border border-warm-200 bg-warm-50/50 p-3 text-sm">
          <div>
            <dt className="text-xs text-warm-500">Đang lưu</dt>
            <dd className="font-mono font-semibold tabular-nums">
              {formatCurrency(storedBalance, currency)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-warm-500">Sau reCal</dt>
            <dd className="font-mono font-semibold tabular-nums text-accent">
              {formatCurrency(computedBalance, currency)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-warm-500">Chênh lệch</dt>
            <dd
              className={cn(
                "font-mono font-semibold tabular-nums",
                hasDrift ? "text-warning" : "text-success")}
            >
              {formatCurrency(drift, currency)}
            </dd>
          </div>
          {isCard ? (
            <>
              <div>
                <dt className="text-xs text-warm-500">Hạn mức</dt>
                <dd className="font-mono tabular-nums">
                  {formatCurrency(creditLimit, currency)}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-warm-500">% sử dụng hạn mức</dt>
                <dd className="tabular-nums text-warm-800">
                  {utilizationPct(storedBalance, creditLimit)}
                  {" → "}
                  <span className="font-semibold">
                    {utilizationPct(computedBalance, creditLimit)}
                  </span>
                </dd>
              </div>
            </>
          ) : null}
        </dl>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="button"
            isLoading={recalcM.isPending}
            onClick={() => void handleConfirm()}
          >
            Xác nhận áp dụng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
