"use client";

import * as React from "react";

import type { FinSource } from "@/features/sources/types";
import { useCreateTransaction } from "@/features/transactions/hooks/useCreateTransaction";
import { Button } from "@/shared/components/ui/Button";
import { CurrencyInput } from "@/shared/components/ui/CurrencyInput";
import { Modal } from "@/shared/components/ui/Modal";
import { formatCurrency } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";

import type { DebtRecordListItem } from "../types";

const selectClassName = cn(
  "h-10 w-full rounded-button border border-warm-200 bg-warm-50 px-3 text-sm text-warm-900",
  "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30");

const inputClassName = cn(
  "h-10 w-full rounded-button border border-warm-200 bg-warm-50 px-3 text-sm text-warm-900",
  "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30");

function todayLocalISODate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export interface DebtPaymentModalProps {
  record: DebtRecordListItem | null;
  paymentSources: FinSource[];
  isOpen: boolean;
  onClose: () => void;
}

export function DebtPaymentModal({
  record,
  paymentSources,
  isOpen,
  onClose,
}: DebtPaymentModalProps) {
  const createTxn = useCreateTransaction();
  const [amount, setAmount] = React.useState(0);
  const [sourceId, setSourceId] = React.useState("");
  const [note, setNote] = React.useState("");
  const [txnDate, setTxnDate] = React.useState(todayLocalISODate);
  const [error, setError] = React.useState<string | undefined>();

  const currency = record?.currency ?? "VND";
  const remaining = record ? Math.max(0, record.remainingAmount) : 0;

  React.useEffect(() => {
    if (!isOpen) {
      setAmount(0);
      setSourceId("");
      setNote("");
      setTxnDate(todayLocalISODate());
      setError(undefined);
      return;
    }
    setSourceId(paymentSources[0]?.id ?? "");
    setAmount(remaining);
    setTxnDate(todayLocalISODate());
  }, [isOpen, paymentSources, remaining]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;
    if (!sourceId) {
      setError("Chọn nguồn tiền");
      return;
    }
    if (amount <= 0) {
      setError("Số tiền phải lớn hơn 0");
      return;
    }
    const eps = currency === "VND" ? 1 : Number.EPSILON * 1000;
    if (amount - remaining > eps) {
      setError(`Tối đa ${formatCurrency(remaining, currency)}`);
      return;
    }
    setError(undefined);
    try {
      await createTxn.mutateAsync({
        type: record.direction === "borrowed" ? "debtRepay" : "loanCollect",
        amount,
        sourceId,
        categoryId: null,
        txnDate,
        note: note.trim() ? note.trim() : null,
        debtRecordId: record.id,
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
      title={
        !record
          ? "Ghi nhận thanh toán"
          : record.direction === "borrowed"
            ? "Ghi nhận trả nợ"
            : "Ghi nhận thu nợ"
      }
      description={
        record
          ? `Còn lại: ${formatCurrency(remaining, currency)} · ${record.personName?.trim() ?? "Không tên"}`
          : undefined
      }
      size="md"
    >
      <form className="flex flex-col gap-4" onSubmit={(ev) => void handleSubmit(ev)}>
        <CurrencyInput
          currency={currency}
          label="Số tiền"
          value={amount}
          onChange={setAmount}
          disabled={createTxn.isPending || !record}
        />

        <div>
          <label
            htmlFor="debt-pay-source"
            className="mb-1 block text-sm font-medium text-warm-700"
          >
            Nguồn tiền
          </label>
          <select
            id="debt-pay-source"
            className={selectClassName}
            value={sourceId}
            onChange={(ev) => setSourceId(ev.target.value)}
            disabled={paymentSources.length === 0 || createTxn.isPending}
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

        <div>
          <label
            htmlFor="debt-pay-date"
            className="mb-1 block text-sm font-medium text-warm-700"
          >
            Ngày giao dịch
          </label>
          <input
            id="debt-pay-date"
            type="date"
            className={inputClassName}
            value={txnDate}
            onChange={(ev) => setTxnDate(ev.target.value)}
            disabled={createTxn.isPending}
          />
        </div>

        <div>
          <label
            htmlFor="debt-pay-note"
            className="mb-1 block text-sm font-medium text-warm-700"
          >
            Ghi chú (tuỳ chọn)
          </label>
          <textarea
            id="debt-pay-note"
            rows={2}
            className={cn(inputClassName, "min-h-[72px] py-2")}
            value={note}
            onChange={(ev) => setNote(ev.target.value)}
            disabled={createTxn.isPending}
            placeholder="VD: Trả tiền mặt"
          />
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={createTxn.isPending}
          >
            Huỷ
          </Button>
          <Button type="submit" disabled={createTxn.isPending || !record}>
            Ghi nhận
          </Button>
        </div>
      </form>
    </Modal>
  );
}
