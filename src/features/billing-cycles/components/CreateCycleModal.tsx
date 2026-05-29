import { useMemo, useState } from "react";

import type { FinSource } from "@/features/sources/types";

import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";
import { formatDate } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";

import { useGenerateCycle } from "../hooks/useGenerateCycle";
import type { BillingCycle } from "../types";
import {
  previewBillingCycleForStatementMonth,
  statementMonthOfCycle,
} from "../utils/billingCycleCalendar";

const MONTH_LABELS = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
] as const;

export interface CreateCycleModalProps {
  card: FinSource | null;
  existingCycles: BillingCycle[];
  isOpen: boolean;
  onClose: () => void;
}

export function CreateCycleModal({
  card,
  existingCycles,
  isOpen,
  onClose,
}: CreateCycleModalProps) {
  const now = new Date();
  const generateM = useGenerateCycle();

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const statementDay = card?.statementDay ?? 1;
  const paymentDueDays = card?.paymentDueDay ?? 25;

  const takenKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const c of existingCycles) {
      const { year: y, month: m } = statementMonthOfCycle(c);
      keys.add(`${String(y)}-${String(m)}`);
    }
    return keys;
  }, [existingCycles]);

  const yearOptions = useMemo(() => {
    const base = now.getFullYear();
    return [base - 2, base - 1, base, base + 1];
  }, [now]);

  const preview = useMemo(
    () =>
      previewBillingCycleForStatementMonth(
        year,
        month,
        statementDay,
        paymentDueDays,
      ),
    [year, month, statementDay, paymentDueDays],
  );

  const monthTaken = takenKeys.has(`${String(year)}-${String(month)}`);

  const handleSubmit = async () => {
    if (!card || monthTaken) return;
    try {
      await generateM.mutateAsync({
        sourceId: card.id,
        statementYear: year,
        statementMonth: month,
      });
      onClose();
    } catch {
      /* toast in hook */
    }
  };

  const selectClass = cn(
    "w-full rounded-button border border-warm-200 bg-surface px-3 py-2 text-sm text-warm-900",
    "outline-none focus-visible:ring-2 focus-visible:ring-accent");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo kỳ sao kê"
      description={
        card
          ? `Chọn tháng sao kê cho thẻ ${card.name} (ngày sao kê: ${String(statementDay)})`
          : undefined
      }
      size="sm"
    >
      {!card ? null : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="cycle-year" className="mb-1 block text-sm text-warm-600">
                Năm sao kê
              </label>
              <select
                id="cycle-year"
                className={selectClass}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="cycle-month" className="mb-1 block text-sm text-warm-600">
                Tháng sao kê
              </label>
              <select
                id="cycle-month"
                className={selectClass}
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              >
                {MONTH_LABELS.map((label, idx) => {
                  const m = idx + 1;
                  const disabled = takenKeys.has(`${String(year)}-${String(m)}`);
                  return (
                    <option key={label} value={m} disabled={disabled}>
                      {label}
                      {disabled ? " (đã có)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <dl className="rounded-card border border-warm-200 bg-warm-25 px-3 py-2 text-sm">
            <dt className="text-warm-500">Tên mặc định</dt>
            <dd className="font-medium text-warm-900">{preview.defaultName}</dd>
            <dt className="mt-2 text-warm-500">Kỳ chi tiêu</dt>
            <dd className="tabular-nums text-warm-800">
              {formatDate(preview.periodStart)} — {formatDate(preview.periodEnd)}
            </dd>
            <dt className="mt-2 text-warm-500">Ngày sao kê / hạn trả</dt>
            <dd className="tabular-nums text-warm-800">
              {formatDate(preview.statementDate)} · hạn{" "}
              {formatDate(preview.paymentDueDate)}
            </dd>
          </dl>

          {monthTaken ? (
            <p className="text-sm text-warning">
              Đã có kỳ sao kê cho tháng này trên thẻ này.
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="button"
              isLoading={generateM.isPending}
              disabled={monthTaken}
              onClick={() => void handleSubmit()}
            >
              Tạo kỳ
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
