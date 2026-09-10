import { AlertTriangle, Plus, RefreshCw } from "lucide-react";

import type { BillingCycleDetailResult } from "../api/billingCyclesApi";
import { useRemoveCycleItem } from "../hooks/useEditCycleItems";
import {
  billingCyclePeriodLabel,
} from "../utils/billingCycleDisplay";
import type { Transaction } from "@/features/transactions/types";
import { Button } from "@/shared/components/ui/Button";
import { formatCurrency, formatDate } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";

import { BillingCycleInstallmentRow } from "./BillingCycleInstallmentRow";
import { BillingCycleTxnRow } from "./BillingCycleTxnRow";

export interface BillingCycleDetailProps {
  detail: BillingCycleDetailResult;
  currency: string;
  mismatchDates?: ReadonlySet<string>;
  onOpenTransaction: (tx: Transaction) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onAddTransaction?: () => void;
}

function MismatchBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold text-warning ring-1 ring-warning/30">
      <AlertTriangle className="size-3" aria-hidden />
      Ngày lệch
    </span>
  );
}

export function BillingCycleDetail({
  detail,
  currency,
  mismatchDates,
  onOpenTransaction,
  onRefresh,
  isRefreshing = false,
  onAddTransaction,
}: BillingCycleDetailProps) {
  const { cycle, transactions, installmentDues } = detail;
  const removeM = useRemoveCycleItem(cycle.id);
  const resolvedCurrency = transactions[0]?.currency ?? currency;
  const isEditable = cycle.status === "open";
  const txnTotal = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const installmentTotal = installmentDues.reduce(
    (sum, due) => sum + due.amount,
    0,
  );
  const hasAnyLines = transactions.length > 0 || installmentDues.length > 0;
  const computedTotal = txnTotal + installmentTotal;
  const displayTotal =
    hasAnyLines && computedTotal > 0 ? computedTotal : cycle.totalAmount;
  const remaining = Math.max(0, displayTotal - cycle.paidAmount);
  const installmentDateMismatch = mismatchDates?.has(
    cycle.statementDate.slice(0, 10),
  );

  const handleRemove = (tx: Transaction) => {
    if (!isEditable) return;
    void removeM.mutateAsync(tx.id);
  };

  return (
    <section className="rounded-card border border-warm-200 bg-surface p-4 shadow-sm sm:p-5">
      {isEditable ? (
        <div className="mb-5 rounded-card border border-accent/20 bg-accent/5 p-3">
          <p className="mb-3 text-sm text-warm-700">
            Kỳ đang mở — bạn có thể <strong>thêm giao dịch mới</strong> trên
            cùng thẻ hoặc <strong>loại bỏ</strong> giao dịch khỏi kỳ bằng nút
            bên từng dòng.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<Plus className="size-4" aria-hidden />}
              onClick={onAddTransaction}
            >
              Thêm giao dịch vào kỳ
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw className="size-4" aria-hidden />}
              isLoading={isRefreshing}
              onClick={onRefresh}
            >
              Làm mới tự động
            </Button>
          </div>
        </div>
      ) : null}

      <dl className="grid grid-cols-2 gap-3 rounded-card border border-warm-200 bg-warm-25 px-4 py-3 text-sm sm:grid-cols-3 lg:grid-cols-5">
        <div>
          <dt className="text-warm-500">Kỳ chi tiêu</dt>
          <dd className="font-medium text-warm-900">
            {billingCyclePeriodLabel(cycle)}
          </dd>
        </div>
        <div>
          <dt className="text-warm-500">Ngày sao kê</dt>
          <dd className="font-medium tabular-nums text-warm-900">
            {formatDate(cycle.statementDate)}
          </dd>
        </div>
        <div>
          <dt className="text-warm-500">Hạn thanh toán</dt>
          <dd className="font-medium tabular-nums text-warm-900">
            {formatDate(cycle.paymentDueDate)}
          </dd>
        </div>
        <div>
          <dt className="text-warm-500">Nguồn thanh toán</dt>
          <dd className="font-medium text-warm-900">{cycle.sourceName}</dd>
        </div>
        <div>
          <dt className="text-warm-500">Số dòng</dt>
          <dd className="font-medium tabular-nums text-warm-900">
            {transactions.length} trả sau · {installmentDues.length} trả góp
          </dd>
        </div>
      </dl>

      <div className="mt-6 grid min-h-0 gap-6 xl:grid-cols-2">
        <section className="min-w-0 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-warm-800">
              Giao dịch trả sau trong kỳ sao kê
            </h2>
            <span className="text-xs tabular-nums text-warm-500">
              {transactions.length} giao dịch
            </span>
          </div>
          {transactions.length > 0 ? (
            <ul className="flex max-h-[65vh] flex-col gap-2 overflow-y-auto pr-1">
              {transactions.map((tx) => {
                const isMismatch = mismatchDates?.has(tx.txnDate.slice(0, 10));
                return (
                  <li
                    key={tx.id}
                    className={cn(
                      "relative rounded-lg",
                      isMismatch &&
                        "bg-warning/10 p-1 ring-2 ring-warning/35 ring-offset-1",
                    )}
                  >
                    {isMismatch ? (
                      <div className="mb-1 pl-1">
                        <MismatchBadge />
                      </div>
                    ) : null}
                    <BillingCycleTxnRow
                      transaction={tx}
                      currency={resolvedCurrency}
                      inclusionSource={tx.inclusionSource}
                      onOpen={onOpenTransaction}
                      onRemove={isEditable ? handleRemove : undefined}
                      isRemoving={
                        removeM.isPending && removeM.variables === tx.id
                      }
                    />
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-lg border border-dashed border-warm-200 bg-warm-25/50 px-4 py-6 text-center">
              <p className="text-sm text-warm-500">
                Chưa có giao dịch trả sau trong kỳ này.
              </p>
              {isEditable && onAddTransaction ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  leftIcon={<Plus className="size-4" aria-hidden />}
                  onClick={onAddTransaction}
                >
                  Thêm giao dịch
                </Button>
              ) : null}
            </div>
          )}
        </section>

        <section className="min-w-0 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-warm-800">
              Các giao dịch trả góp trong kỳ sao kê
            </h2>
            <span className="text-xs tabular-nums text-warm-500">
              {installmentDues.length} kỳ trả góp
            </span>
          </div>
          {installmentDues.length > 0 ? (
            <ul className="flex max-h-[65vh] flex-col gap-2 overflow-y-auto pr-1">
              {installmentDues.map((due) => (
                <li
                  key={due.payId}
                  className={cn(
                    "relative rounded-lg",
                    installmentDateMismatch &&
                      "bg-warning/10 p-1 ring-2 ring-warning/35 ring-offset-1",
                  )}
                >
                  {installmentDateMismatch ? (
                    <div className="mb-1 pl-1">
                      <MismatchBadge />
                    </div>
                  ) : null}
                  <BillingCycleInstallmentRow
                    due={due}
                    currency={resolvedCurrency}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-lg border border-dashed border-warm-200 bg-warm-25/50 px-4 py-6 text-center">
              <p className="text-sm text-warm-500">
                Chưa có giao dịch trả góp trong kỳ này.
              </p>
            </div>
          )}
        </section>
      </div>

      <footer className="mt-6 grid gap-2 border-t border-warm-200 pt-4 text-sm sm:ml-auto sm:max-w-md">
        <div className="flex items-center justify-between text-warm-600">
          <span>Giao dịch trả sau</span>
          <span className="font-mono tabular-nums">
            {formatCurrency(txnTotal, resolvedCurrency)}
          </span>
        </div>
        <div className="flex items-center justify-between text-warm-600">
          <span>Trả góp</span>
          <span className="font-mono tabular-nums">
            {formatCurrency(installmentTotal, resolvedCurrency)}
          </span>
        </div>
        <div className="flex items-center justify-between font-medium text-warm-700">
          <span>Tổng phát sinh</span>
          <span className="font-mono tabular-nums text-warm-900">
            {formatCurrency(displayTotal, resolvedCurrency)}
          </span>
        </div>
        <div className="flex items-center justify-between text-warm-600">
          <span>Đã thanh toán</span>
          <span className="font-mono tabular-nums">
            {formatCurrency(cycle.paidAmount, resolvedCurrency)}
          </span>
        </div>
        <div className="flex items-center justify-between font-semibold text-warm-800">
          <span>Còn lại</span>
          <span className="font-mono tabular-nums text-accent-emphasis">
            {formatCurrency(remaining, resolvedCurrency)}
          </span>
        </div>
      </footer>
    </section>
  );
}
