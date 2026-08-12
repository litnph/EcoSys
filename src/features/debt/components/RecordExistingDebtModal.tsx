import * as React from "react";

import { Button } from "@/shared/components/ui/Button";
import { CurrencyInput } from "@/shared/components/ui/CurrencyInput";
import { Input } from "@/shared/components/ui/Input";
import { Modal } from "@/shared/components/ui/Modal";
import { toApiWholeAmount } from "@/shared/lib/currencyUnits";
import { cn } from "@/shared/lib/utils";

import { useCreateDebtRecord } from "../hooks/useCreateDebtRecord";
import type { DebtDirection } from "../types";

const inputClassName = cn(
  "h-10 w-full rounded-button border border-warm-200 bg-warm-50 px-3 text-sm text-warm-900",
  "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30");

export interface RecordExistingDebtModalProps {
  direction: DebtDirection;
  currency?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RecordExistingDebtModal({
  direction,
  currency = "VND",
  isOpen,
  onClose,
}: RecordExistingDebtModalProps) {
  const createM = useCreateDebtRecord();
  const [amount, setAmount] = React.useState(0);
  const [personName, setPersonName] = React.useState("");
  const [personContact, setPersonContact] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | undefined>();

  React.useEffect(() => {
    if (!isOpen) {
      setAmount(0);
      setPersonName("");
      setPersonContact("");
      setDueDate("");
      setNote("");
      setError(undefined);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = personName.trim();
    if (!name) {
      setError("Nhập tên đối tác");
      return;
    }
    if (amount <= 0) {
      setError("Số tiền phải lớn hơn 0");
      return;
    }
    setError(undefined);
    try {
      await createM.mutateAsync({
        direction,
        personName: name,
        personContact: personContact.trim() || null,
        amount: toApiWholeAmount(amount),
        currency,
        dueDate: dueDate.trim() || null,
        note: note.trim() || null,
      });
      onClose();
    } catch {
      /* toast in hook */
    }
  };

  const isBorrowed = direction === "borrowed";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ghi nhận nợ hiện có"
      description={
        isBorrowed
          ? "Khoản bạn đang nợ từ trước — không cộng vào ví và không ảnh hưởng báo cáo thu/chi. Dùng「Mượn tiền」trong giao dịch khi vừa nhận tiền vay."
          : "Khoản người khác đang nợ bạn từ trước — không trừ ví. Dùng「Cho vay」trong giao dịch khi vừa cho mượn tiền."
      }
      size="md"
    >
      <form className="flex flex-col gap-4" onSubmit={(ev) => void handleSubmit(ev)}>
        <CurrencyInput
          currency={currency}
          label="Số tiền còn nợ"
          value={amount}
          onChange={setAmount}
          disabled={createM.isPending}
          required
        />

        <Input
          label="Tên đối tác"
          value={personName}
          onChange={(ev) => setPersonName(ev.target.value)}
          disabled={createM.isPending}
          placeholder={isBorrowed ? "Ai cho bạn mượn?" : "Ai đang nợ bạn?"}
          required
        />

        <Input
          label="Liên hệ (tuỳ chọn)"
          value={personContact}
          onChange={(ev) => setPersonContact(ev.target.value)}
          disabled={createM.isPending}
          placeholder="SĐT hoặc nơi nhắn"
        />

        <div>
          <label
            htmlFor="existing-debt-due"
            className="mb-1 block text-sm font-medium text-warm-700"
          >
            Hạn trả{" "}
            <span className="font-normal text-warm-500">(tuỳ chọn)</span>
          </label>
          <input
            id="existing-debt-due"
            type="date"
            className={inputClassName}
            value={dueDate}
            onChange={(ev) => setDueDate(ev.target.value)}
            disabled={createM.isPending}
          />
        </div>

        <div>
          <label
            htmlFor="existing-debt-note"
            className="mb-1 block text-sm font-medium text-warm-700"
          >
            Ghi chú (tuỳ chọn)
          </label>
          <textarea
            id="existing-debt-note"
            rows={2}
            className={cn(inputClassName, "min-h-[72px] py-2")}
            value={note}
            onChange={(ev) => setNote(ev.target.value)}
            disabled={createM.isPending}
            placeholder="VD: Vay bạn A từ tháng 3"
          />
        </div>

        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={createM.isPending}
          >
            Huỷ
          </Button>
          <Button type="submit" isLoading={createM.isPending}>
            Ghi nhận
          </Button>
        </div>
      </form>
    </Modal>
  );
}
