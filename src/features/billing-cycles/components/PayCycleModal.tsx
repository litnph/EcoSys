"use client";

import * as React from "react";

import type { FinSource } from "@/features/sources/types";
import { Button } from "@/shared/components/ui/Button";
import { CurrencyInput } from "@/shared/components/ui/CurrencyInput";
import { Modal } from "@/shared/components/ui/Modal";
import { cn } from "@/shared/lib/utils";

import { formatCurrency } from "@/shared/lib/formatters";

import { usePayCycle } from "../hooks/usePayCycle";
import type { BillingCycle } from "../types";

const selectClassName = cn(
  "h-10 w-full rounded-button border border-warm-200 bg-warm-50 px-3 text-sm text-warm-900",
  "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30",
);

export interface PayCycleModalProps {
  cycle: BillingCycle | null;
  paymentSources: FinSource[];
  currency: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PayCycleModal({
  cycle,
  paymentSources,
  currency,
  isOpen,
  onClose,
}: PayCycleModalProps) {
  const payM = usePayCycle();
  const [paymentSourceId, setPaymentSourceId] = React.useState("");
  const [amount, setAmount] = React.useState(0);
  const [error, setError] = React.useState<string | undefined>();

  const remaining = cycle
    ? Math.max(0, cycle.totalAmount - cycle.paidAmount)
    : 0;

  React.useEffect(() => {
    if (!isOpen) {
      setPaymentSourceId("");
      setAmount(0);
      setError(undefined);
      return;
    }
    setPaymentSourceId(paymentSources[0]?.id ?? "");
    setAmount(remaining);
  }, [isOpen, remaining, paymentSources]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycle) return;
    if (!paymentSourceId) {
      setError("Chọn nguồn thanh toán");
      return;
    }
    if (amount <= 0) {
      setError("Số tiền phải lớn hơn 0");
      return;
    }
    const eps =
      currency === "VND" ? 1 : Number.EPSILON * 1000;
    if (amount - remaining > eps) {
      setError(`Tối đa ${remaining.toFixed(currency === "VND" ? 0 : 2)}`);
      return;
    }
    setError(undefined);
    try {
      await payM.mutateAsync({
        id: cycle.id,
        body: { paymentSourceId, amount },
      });
      onClose();
    } catch {
      /* toast in hook */
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thanh toán kỳ sao kê"
      description={
        cycle ? `Số còn lại: ${formatCurrency(remaining, currency)}` : undefined
      }
      size="md"
    >
      <form className="flex flex-col gap-4" onSubmit={(ev) => void handleSubmit(ev)}>
        <div>
          <label
            htmlFor="billing-pay-source"
            className="mb-1 block text-sm font-medium text-warm-700"
          >
            Nguồn thanh toán
          </label>
          <select
            id="billing-pay-source"
            className={selectClassName}
            value={paymentSourceId}
            onChange={(ev) => setPaymentSourceId(ev.target.value)}
            disabled={paymentSources.length === 0 || payM.isPending}
          >
            <option value="">
              {paymentSources.length === 0
                ? "Không có nguồn khác"
                : "— Chọn —"}
            </option>
            {paymentSources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </div>

        <CurrencyInput
          label="Số tiền"
          currency={currency}
          value={amount}
          onChange={(v) => {
            const next =
              currency === "VND"
                ? Math.min(v, Math.ceil(remaining))
                : Math.min(v, remaining);
            setAmount(next);
          }}
          disabled={payM.isPending}
          error={error}
        />

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="submit"
            isLoading={payM.isPending}
            disabled={paymentSources.length === 0 || remaining <= 0}
          >
            Xác nhận thanh toán
          </Button>
        </div>
      </form>
    </Modal>
  );
}
