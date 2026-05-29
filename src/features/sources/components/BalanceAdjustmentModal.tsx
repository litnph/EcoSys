import * as React from "react";

import { Button } from "@/shared/components/ui/Button";
import { CurrencyInput } from "@/shared/components/ui/CurrencyInput";
import { Input } from "@/shared/components/ui/Input";
import { Modal } from "@/shared/components/ui/Modal";

import { useCreateBalanceAdjustment } from "../hooks/useCreateBalanceAdjustment";

export interface BalanceAdjustmentModalProps {
  sourceId: string;
  currency: string;
  isOpen: boolean;
  onClose: () => void;
}

export function BalanceAdjustmentModal({
  sourceId,
  currency,
  isOpen,
  onClose,
}: BalanceAdjustmentModalProps) {
  const adjustM = useCreateBalanceAdjustment(sourceId);
  const [direction, setDirection] = React.useState<"up" | "down">("up");
  const [amount, setAmount] = React.useState(0);
  const [txnDate, setTxnDate] = React.useState(() =>
    new Date().toISOString().slice(0, 10));
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    if (!isOpen) {
      setDirection("up");
      setAmount(0);
      setTxnDate(new Date().toISOString().slice(0, 10));
      setNote("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim() || amount === 0) return;
    try {
      const signed = direction === "down" ? -Math.abs(amount) : Math.abs(amount);
      await adjustM.mutateAsync({
        amount: signed,
        txnDate,
        note: note.trim(),
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
      title="Điều chỉnh số dư"
      description="Chênh lệch so với sổ thực tế. Không tính vào báo cáo thu/chi tháng."
      size="md"
    >
      <form className="flex flex-col gap-4" onSubmit={(ev) => void handleSubmit(ev)}>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={direction === "up" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setDirection("up")}
          >
            Tăng số dư
          </Button>
          <Button
            type="button"
            variant={direction === "down" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setDirection("down")}
          >
            Giảm số dư
          </Button>
        </div>
        <CurrencyInput
          label="Số tiền"
          value={amount}
          onChange={setAmount}
          currency={currency}
        />
        <Input
          type="date"
          label="Ngày giao dịch"
          value={txnDate}
          onChange={(ev) => setTxnDate(ev.target.value)}
        />
        <Input
          label="Lý do"
          value={note}
          onChange={(ev) => setNote(ev.target.value)}
          placeholder="Ví dụ: Khớp sao kê ngân hàng tháng 5"
          required
        />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="submit"
            isLoading={adjustM.isPending}
            disabled={!note.trim() || amount === 0}
          >
            Ghi điều chỉnh
          </Button>
        </div>
      </form>
    </Modal>
  );
}
