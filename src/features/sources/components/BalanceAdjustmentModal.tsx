import * as React from "react";

import { Button } from "@/shared/components/ui/Button";
import { CurrencyInput } from "@/shared/components/ui/CurrencyInput";
import { Input } from "@/shared/components/ui/Input";
import { Modal } from "@/shared/components/ui/Modal";
import { formatCurrency } from "@/shared/lib/formatters";
import { toApiWholeAmount } from "@/shared/lib/currencyUnits";
import { cn } from "@/shared/lib/utils";

import { getSourceBalanceLedger } from "../api/sourceBalanceApi";
import { useCreateBalanceAdjustment } from "../hooks/useCreateBalanceAdjustment";
import { useRecalculateSourceBalance } from "../hooks/useRecalculateSourceBalance";

type AdjustMode = "delta" | "target";

export interface BalanceAdjustmentModalProps {
  sourceId: string;
  currency: string;
  storedBalance?: number;
  computedBalance?: number;
  drift?: number;
  isOpen: boolean;
  onClose: () => void;
  onApplied?: () => void;
}

export function BalanceAdjustmentModal({
  sourceId,
  currency,
  storedBalance = 0,
  computedBalance = 0,
  drift = 0,
  isOpen,
  onClose,
  onApplied,
}: BalanceAdjustmentModalProps) {
  const adjustM = useCreateBalanceAdjustment(sourceId);
  const recalcM = useRecalculateSourceBalance(sourceId);
  const [mode, setMode] = React.useState<AdjustMode>("target");
  const [direction, setDirection] = React.useState<"up" | "down">("up");
  const [amount, setAmount] = React.useState(0);
  const [targetBalance, setTargetBalance] = React.useState(0);
  const [txnDate, setTxnDate] = React.useState(() =>
    new Date().toISOString().slice(0, 10));
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | undefined>();

  const hasDrift = Math.abs(drift) > (currency === "VND" ? 0.5 : 0.005);
  const pending = adjustM.isPending || recalcM.isPending;

  React.useEffect(() => {
    if (!isOpen) {
      setMode("target");
      setDirection("up");
      setAmount(0);
      setTargetBalance(storedBalance);
      setTxnDate(new Date().toISOString().slice(0, 10));
      setNote("");
      setError(undefined);
      return;
    }
    setTargetBalance(storedBalance);
  }, [isOpen, storedBalance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      setError("Nhập lý do điều chỉnh");
      return;
    }

    try {
      if (mode === "delta") {
        const signed =
          direction === "down" ? -Math.abs(amount) : Math.abs(amount);
        if (signed === 0) {
          setError("Số tiền phải khác 0");
          return;
        }
        setError(undefined);
        await adjustM.mutateAsync({
          amount: toApiWholeAmount(signed),
          txnDate,
          note: note.trim(),
        });
      } else {
        setError(undefined);
        if (hasDrift) {
          await recalcM.mutateAsync();
        }
        const ledger = await getSourceBalanceLedger(sourceId);
        const delta = toApiWholeAmount(targetBalance) - ledger.computedBalance;
        const eps = currency === "VND" ? 1 : 0.01;
        if (Math.abs(delta) <= eps) {
          setError("Số dư mục tiêu trùng với số dư hiện tại");
          return;
        }
        await adjustM.mutateAsync({
          amount: delta,
          txnDate,
          note: note.trim(),
        });
      }
      onApplied?.();
      onClose();
    } catch {
      /* toast in hooks */
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Điều chỉnh số dư"
      description="Không tính vào báo cáo thu/chi tháng. Dùng khi số trên sổ khác thực tế (sao kê, đếm tiền mặt…)."
      size="md"
    >
      <form className="flex flex-col gap-4" onSubmit={(ev) => void handleSubmit(ev)}>
        <dl className="grid grid-cols-3 gap-2 rounded-lg border border-warm-200 bg-warm-50/80 px-3 py-2 text-xs">
          <div>
            <dt className="text-warm-500">Đang lưu</dt>
            <dd className="font-mono font-semibold tabular-nums text-warm-900">
              {formatCurrency(storedBalance, currency)}
            </dd>
          </div>
          <div>
            <dt className="text-warm-500">Tính từ sổ</dt>
            <dd className="font-mono font-semibold tabular-nums text-warm-900">
              {formatCurrency(computedBalance, currency)}
            </dd>
          </div>
          <div>
            <dt className="text-warm-500">Chênh</dt>
            <dd
              className={cn(
                "font-mono font-semibold tabular-nums",
                hasDrift ? "text-warning" : "text-success")}
            >
              {formatCurrency(drift, currency)}
            </dd>
          </div>
        </dl>

        {hasDrift ? (
          <p
            className="rounded-button border border-warning/35 bg-warning/10 px-3 py-2 text-xs text-warm-800"
            role="status"
          >
            Số lưu và số tính từ giao dịch đang lệch. Chế độ「Đặt số dư mục tiêu」sẽ
            khớp sổ trước, rồi ghi điều chỉnh tới số bạn nhập.
          </p>
        ) : null}

        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === "target" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setMode("target")}
            disabled={pending}
          >
            Đặt số dư mục tiêu
          </Button>
          <Button
            type="button"
            variant={mode === "delta" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setMode("delta")}
            disabled={pending}
          >
            Cộng / trừ
          </Button>
        </div>

        {mode === "target" ? (
          <CurrencyInput
            label="Số dư sau điều chỉnh"
            value={targetBalance}
            onChange={setTargetBalance}
            currency={currency}
            disabled={pending}
          />
        ) : (
          <>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={direction === "up" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setDirection("up")}
                disabled={pending}
              >
                Tăng
              </Button>
              <Button
                type="button"
                variant={direction === "down" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setDirection("down")}
                disabled={pending}
              >
                Giảm
              </Button>
            </div>
            <CurrencyInput
              label="Số tiền"
              value={amount}
              onChange={setAmount}
              currency={currency}
              disabled={pending}
            />
            {hasDrift ? (
              <p className="text-xs text-warm-500">
                Cộng/trừ làm thay đổi cả số lưu và số tính từ sổ — chênh lệch giữa
                hai cột không đổi. Muốn khớp số dư thực tế, dùng「Đặt số dư mục
                tiêu」.
              </p>
            ) : null}
          </>
        )}

        <Input
          type="date"
          label="Ngày giao dịch"
          value={txnDate}
          onChange={(ev) => setTxnDate(ev.target.value)}
          disabled={pending}
        />
        <Input
          label="Lý do"
          value={note}
          onChange={(ev) => setNote(ev.target.value)}
          placeholder="Ví dụ: Khớp sao kê ngân hàng tháng 5"
          required
          disabled={pending}
        />

        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Hủy
          </Button>
          <Button
            type="submit"
            isLoading={pending}
            disabled={
              !note.trim() ||
              (mode === "delta" ? amount === 0 : false)
            }
          >
            Ghi điều chỉnh
          </Button>
        </div>
      </form>
    </Modal>
  );
}
