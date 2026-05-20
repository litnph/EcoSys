"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { getTransactions } from "@/features/transactions/api/transactionsApi";
import type { FinSource } from "@/features/sources/types";
import type { Transaction } from "@/features/transactions/types";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Modal } from "@/shared/components/ui/Modal";
import { cn } from "@/shared/lib/utils";
import { formatCurrency } from "@/shared/lib/formatters";

import {
  getInstallmentPlanDetail,
  getInstallmentPlans,
} from "../api/installmentsApi";
import { installmentKeys } from "../api/installmentKeys";
import { useCreateInstallmentPlan } from "../hooks/useCreateInstallmentPlan";

const selectClassName = cn(
  "h-10 w-full rounded-button border border-warm-200 bg-warm-50 px-3 text-sm text-warm-900",
  "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30");

function splitSchedule(total: number, months: number): {
  monthlyShare: number;
  lastShare: number;
} {
  const monthlyShare =
    total > 0 ? Math.trunc(total / months) * Math.sign(total) : 0;
  const lastShare = total - monthlyShare * (months - 1);
  return { monthlyShare, lastShare };
}

async function fetchBlockedOriginalTxnIds(): Promise<
  Set<string>
> {
  const active = await getInstallmentPlans( "active");
  const details = await Promise.all(
    active.map((p) => getInstallmentPlanDetail(p.id)));
  const set = new Set<string>();
  for (const d of details) {
    set.add(d.originalTxnId);
  }
  return set;
}

export interface CreateInstallmentPlanModalProps {
  sources: FinSource[] | undefined;
  isOpen: boolean;
  onClose: () => void;
}

export function CreateInstallmentPlanModal({
  sources,
  isOpen,
  onClose,
}: CreateInstallmentPlanModalProps) {
  const createM = useCreateInstallmentPlan();
  const [txnId, setTxnId] = React.useState("");
  const [totalMonths, setTotalMonths] = React.useState(12);
  const [zeroInterest, setZeroInterest] = React.useState(true);
  const [conversionFeeRate, setConversionFeeRate] = React.useState(2);
  const [interestRate, setInterestRate] = React.useState(1.5);

  const sourceFingerprint = (sources ?? [])
    .map(
      (s) =>
        `${s.id}:${s.type}:${String(s.minInstallmentAmt ?? "")}`)
    .sort()
    .join("|");

  const eligibleQ = useQuery({
    queryKey: [
      ...installmentKeys.all,
      "eligible-deferred",
      sourceFingerprint,
    ] as const,
    queryFn: async (): Promise<Transaction[]> => {
      const map = new Map<string, FinSource>();
      for (const s of sources ?? []) map.set(s.id, s);
      const blocked = await fetchBlockedOriginalTxnIds();
      const page = await getTransactions({
        type: "deferred",
        page: 1,
        pageSize: 100,
      });
      return page.items.filter((tx) => {
        const src = map.get(tx.sourceId);
        if (!src || src.type !== "creditCard") return false;
        if (blocked.has(tx.id)) return false;
        if (
          src.minInstallmentAmt != null &&
          tx.amount < src.minInstallmentAmt
        ) {
          return false;
        }
        return true;
      });
    },
    enabled: isOpen && (sources?.length ?? 0) > 0,
    staleTime: 20_000,
  });

  const selectedTxn = eligibleQ.data?.find((t) => t.id === txnId);

  React.useEffect(() => {
    if (!isOpen) {
      setTxnId("");
      setTotalMonths(12);
      setZeroInterest(true);
      setConversionFeeRate(2);
      setInterestRate(1.5);
      return;
    }
    const first = eligibleQ.data?.[0]?.id;
    if (first && !txnId) setTxnId(first);
  }, [isOpen, eligibleQ.data, txnId]);

  const currency = selectedTxn?.currency ?? "VND";

  const preview = React.useMemo(() => {
    if (!selectedTxn) return null;
    const total = selectedTxn.amount;
    const { monthlyShare, lastShare } = splitSchedule(total, totalMonths);
    const fee =
      zeroInterest && conversionFeeRate > 0
        ? Math.round(total * (conversionFeeRate / 100) * 100) / 100
        : 0;
    const grand = total + fee;
    return { monthlyShare, lastShare, fee, grand };
  }, [selectedTxn, totalMonths, zeroInterest, conversionFeeRate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txnId) return;
    const body = {
      originalTxnId: txnId,
      totalMonths,
      interestRate: zeroInterest ? 0 : interestRate,
      conversionFeeRate:
        zeroInterest && conversionFeeRate > 0 ? conversionFeeRate : null,
    };
    if (zeroInterest && (!conversionFeeRate || conversionFeeRate <= 0)) {
      return;
    }
    if (!zeroInterest && interestRate <= 0) {
      return;
    }
    try {
      await createM.mutateAsync(body);
      onClose();
    } catch {
      /* toast */
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo trả góp"
      description="Chọn giao dịch quẹt thẻ đủ điều kiện trên thẻ tín dụng."
      size="lg"
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(ev) => void handleSubmit(ev)}
      >
        <div>
          <label
            htmlFor="installment-txn"
            className="mb-1 block text-sm font-medium text-warm-700"
          >
            Giao dịch gốc
          </label>
          <select
            id="installment-txn"
            className={selectClassName}
            value={txnId}
            onChange={(ev) => setTxnId(ev.target.value)}
            disabled={eligibleQ.isLoading || eligibleQ.isPending}
          >
            <option value="">
              {eligibleQ.isLoading ? "Đang tải…" : "— Chọn giao dịch —"}
            </option>
            {(eligibleQ.data ?? []).map((tx) => (
              <option key={tx.id} value={tx.id}>
                {formatCurrency(tx.amount, tx.currency)} · {tx.description ?? tx.id.slice(0, 8)} · {tx.sourceName}
              </option>
            ))}
          </select>
          {eligibleQ.data && eligibleQ.data.length === 0 && !eligibleQ.isLoading ? (
            <p className="mt-2 text-sm text-warm-500">
              Không có giao dịch deferred khả dụng (thẻ tín dụng, đủ hạn mức chuyển đổi, chưa có kế hoạch active).
            </p>
          ) : null}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <label className="text-sm font-medium text-warm-700">
              Thời hạn · {String(totalMonths)} tháng
            </label>
            <span className="font-mono text-xs tabular-nums text-warm-500">
              3–60
            </span>
          </div>
          <input
            type="range"
            min={3}
            max={60}
            step={1}
            value={totalMonths}
            onChange={(ev) => setTotalMonths(Number(ev.target.value))}
            className="w-full accent-accent"
          />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-button border border-warm-100 bg-warm-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-warm-800">0% lãi suất</p>
            <p className="text-xs text-warm-500">
              Bật: nhập phí chuyển đổi trả góp (theo % giao dịch).
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={zeroInterest}
            onClick={() => setZeroInterest(!zeroInterest)}
            className={cn(
              "relative h-8 w-14 shrink-0 rounded-full transition-colors",
              zeroInterest ? "bg-accent" : "bg-warm-300")}
          >
            <span
              className={cn(
                "absolute top-1 left-1 block size-6 rounded-full bg-surface shadow transition-transform",
                zeroInterest && "translate-x-6")}
            />
          </button>
        </div>

        {zeroInterest ? (
          <Input
            type="number"
            label="Phí chuyển đổi (%/giao dịch)"
            min={0.01}
            step={0.01}
            value={conversionFeeRate}
            onChange={(ev) => setConversionFeeRate(Number(ev.target.value))}
          />
        ) : (
          <Input
            type="number"
            label="Lãi suất (% năm — lưu trên kế hoạch)"
            min={0}
            step={0.01}
            value={interestRate}
            onChange={(ev) => setInterestRate(Number(ev.target.value))}
          />
        )}

        {preview && selectedTxn ? (
          <div className="rounded-card border border-warm-200 bg-warm-25/80 p-4 text-sm">
            <p className="mb-2 font-medium text-warm-800">Xem trước</p>
            <dl className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-warm-500">Mỗi kỳ (đa số)</dt>
                <dd className="font-mono font-semibold tabular-nums">
                  {formatCurrency(preview.monthlyShare, currency)}
                </dd>
              </div>
              <div>
                <dt className="text-warm-500">Kỳ cuối</dt>
                <dd className="font-mono font-semibold tabular-nums">
                  {formatCurrency(preview.lastShare, currency)}
                </dd>
              </div>
              <div>
                <dt className="text-warm-500">Tổng phí chuyển đổi (ước tính)</dt>
                <dd className="font-mono font-semibold tabular-nums">
                  {formatCurrency(preview.fee, currency)}
                </dd>
              </div>
              <div>
                <dt className="text-warm-500">Tổng phải trả (gốc + phí)</dt>
                <dd className="font-mono font-semibold tabular-nums text-accent">
                  {formatCurrency(preview.grand, currency)}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="submit"
            isLoading={createM.isPending}
            disabled={
              !txnId ||
              (zeroInterest && conversionFeeRate <= 0) ||
              (!zeroInterest && interestRate <= 0) ||
              eligibleQ.data?.length === 0
            }
          >
            Tạo kế hoạch
          </Button>
        </div>
      </form>
    </Modal>
  );
}
