import { AlertTriangle } from "lucide-react";

import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";
import { formatCurrency } from "@/shared/lib/formatters";

import { useRecalculateSourceBalance } from "../hooks/useRecalculateSourceBalance";
import { creditSourceBreakdown } from "../utils/creditSourceBreakdown";

import { CreditLimitBar } from "./CreditLimitBar";

export interface RecalculateSourceConfirmModalProps {
  sourceId: string;
  sourceName: string;
  currency: string;
  storedBalance: number;
  computedBalance: number;
  drift: number;
  creditLimit?: number | null;
  installmentRemainingAmount?: number;
  isOpen: boolean;
  onClose: () => void;
  onApplied?: () => void;
}

export function RecalculateSourceConfirmModal({
  sourceId,
  sourceName,
  currency,
  storedBalance,
  computedBalance,
  drift,
  creditLimit,
  installmentRemainingAmount = 0,
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
  const stored = isCard ? Math.max(0, storedBalance) : storedBalance;
  const computed = isCard ? Math.max(0, computedBalance) : computedBalance;
  const breakdown = isCard
    ? creditSourceBreakdown({
        id: sourceId,
        name: sourceName,
        type: "creditCard",
        balance: computedBalance,
        creditLimit,
        statementDay: null,
        paymentDueDay: null,
        minInstallmentAmt: null,
        currency,
        icon: null,
        color: null,
        sortOrder: 0,
        installmentRemainingAmount,
      })
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="reCal"
      description={sourceName}
      size="sm"
    >
      <div className="flex flex-col gap-3">
        {hasDrift ? (
          <p className="flex items-start gap-2 text-xs text-warm-700">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden />
            Số lưu khác số tính lại. Xác nhận để cập nhật.
          </p>
        ) : (
          <p className="text-xs text-warm-500">Số liệu đã khớp.</p>
        )}

        <div className="rounded-lg border border-warm-200 bg-warm-50/50 px-3 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-mono tabular-nums text-warm-700">
                {formatCurrency(stored, currency)}
              </span>
              <span className="text-warm-300">→</span>
              <span className="font-mono font-semibold tabular-nums text-accent">
                {formatCurrency(computed, currency)}
              </span>
            </div>
            {hasDrift ? (
              <Badge size="sm" variant="warning">
                {formatCurrency(drift, currency)}
              </Badge>
            ) : (
              <Badge size="sm" variant="success">
                Khớp
              </Badge>
            )}
          </div>

          {breakdown ? (
            <div className="mt-2 space-y-1 border-t border-warm-200/80 pt-2">
              <CreditLimitBar
                spentPct={breakdown.bar.spentPct}
                installmentPct={breakdown.bar.installmentPct}
                availablePct={breakdown.bar.availablePct}
                className="h-1.5"
              />
              <p className="text-[11px] tabular-nums text-warm-500">
                Chi {formatCurrency(breakdown.spentAmount, currency)}
                {" · "}TG {formatCurrency(breakdown.installmentAmount, currency)}
                {" · "}KD {formatCurrency(breakdown.availableAmount, currency)}
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="button"
            size="sm"
            isLoading={recalcM.isPending}
            onClick={() => void handleConfirm()}
          >
            Áp dụng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
