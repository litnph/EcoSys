import * as React from "react";

import type { FinSource } from "@/features/sources/types";
import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";
import { cn } from "@/shared/lib/utils";
import { formatCurrency } from "@/shared/lib/formatters";

import { useRecordInstallmentPayment } from "../hooks/useRecordInstallmentPayment";
import type { InstallmentPay } from "../types";

const selectClassName = cn(
  "h-10 w-full rounded-button border border-warm-200 bg-warm-50 px-3 text-sm text-warm-900",
  "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30");

export interface PayInstallmentModalProps {
  planId: string | null;
  pay: InstallmentPay | null;
  paymentSources: FinSource[];
  currency: string;
  expectedVersion: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PayInstallmentModal({
  planId,
  pay,
  paymentSources,
  currency,
  expectedVersion,
  isOpen,
  onClose,
}: PayInstallmentModalProps) {
  const recordM = useRecordInstallmentPayment();
  const [paymentSourceId, setPaymentSourceId] = React.useState("");

  const due = pay
    ? Math.max(0, pay.amount - pay.paidAmount)
    : 0;

  React.useEffect(() => {
    if (!isOpen) {
      setPaymentSourceId("");
      return;
    }
    setPaymentSourceId(paymentSources[0]?.id ?? "");
  }, [isOpen, paymentSources]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planId || !pay || expectedVersion === null) return;
    if (!paymentSourceId) return;
    try {
      await recordM.mutateAsync({
        planId,
        installmentNumber: pay.installmentNumber,
        paymentSourceId,
        expectedVersion,
      });
      onClose();
    } catch {
      /* toast trong hook */
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thanh toán một kỳ"
      description={
        pay
          ? `Kỳ ${String(pay.installmentNumber)} · Hạn thanh toán ${pay.dueDate}`
          : undefined
      }
      size="md"
    >
      <form className="flex flex-col gap-4" onSubmit={(ev) => void handleSubmit(ev)}>
        <div className="rounded-button border border-warm-100 bg-warm-50 px-4 py-3 text-sm">
          <p className="text-warm-600">Số tiền thanh toán</p>
          <p className="font-mono text-lg font-semibold tabular-nums text-warm-900">
            {formatCurrency(due, currency)}
          </p>
        </div>

        <div>
          <label
            htmlFor="installment-pay-source"
            className="mb-1 block text-sm font-medium text-warm-700"
          >
            Nguồn thanh toán
          </label>
          <select
            id="installment-pay-source"
            className={selectClassName}
            value={paymentSourceId}
            onChange={(ev) => setPaymentSourceId(ev.target.value)}
            disabled={paymentSources.length === 0 || recordM.isPending}
          >
            <option value="">
              {paymentSources.length === 0 ? "Không có nguồn" : "— Chọn —"}
            </option>
            {paymentSources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="submit"
            isLoading={recordM.isPending}
            disabled={
              !planId || !pay || paymentSources.length === 0 || due <= 0
            }
          >
            Xác nhận thanh toán
          </Button>
        </div>
      </form>
    </Modal>
  );
}
