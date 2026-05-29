import { Plus, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

import type { Transaction } from "@/features/transactions/types";

import { Button } from "@/shared/components/ui/Button";
import { Drawer } from "@/shared/components/ui/Drawer";
import { SkeletonText } from "@/shared/components/ui/Skeleton";
import { formatCurrency, formatDate } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";
import { listStaggerItemMotion, listStaggerMotion } from "@/shared/lib/animations";

import { useBillingCycleDetail } from "../hooks/useBillingCycles";
import { useRemoveCycleItem } from "../hooks/useEditCycleItems";
import {
  billingCycleDisplayName,
  billingCyclePeriodLabel,
} from "../utils/billingCycleDisplay";

import { BillingCycleTxnRow } from "./BillingCycleTxnRow";
import { BillingCycleInstallmentRow } from "./BillingCycleInstallmentRow";

function BillingCycleDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="grid grid-cols-2 gap-3 rounded-card border border-warm-200 bg-warm-25 px-4 py-3">
        <SkeletonText className="h-16 w-full rounded-md" />
        <SkeletonText className="h-16 w-full rounded-md" />
      </div>
      <div className="space-y-2">
        <SkeletonText className="h-5 w-40" />
        <SkeletonText className="h-[72px] w-full rounded-lg" />
        <SkeletonText className="h-[72px] w-full rounded-lg" />
      </div>
    </div>
  );
}

export interface BillingCycleDetailProps {
  cycleId: string | null;
  currency: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenTransaction: (tx: Transaction) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onAddTransaction?: () => void;
}

export function BillingCycleDetail({
  cycleId,
  currency,
  isOpen,
  onClose,
  onOpenTransaction,
  onRefresh,
  isRefreshing = false,
  onAddTransaction,
}: BillingCycleDetailProps) {
  const detailQ = useBillingCycleDetail(cycleId, isOpen);
  const removeM = useRemoveCycleItem(cycleId ?? "__none__");
  const cycle = detailQ.data?.cycle;
  const transactions = detailQ.data?.transactions ?? [];
  const installmentDues = detailQ.data?.installmentDues ?? [];
  const resolvedCurrency = transactions[0]?.currency ?? currency;
  const isEditable = cycle?.status === "open";
  const txnTotal = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const installmentTotal = installmentDues.reduce(
    (sum, due) => sum + due.amount,
    0,
  );
  const hasAnyLines = transactions.length > 0 || installmentDues.length > 0;
  const computedTotal = txnTotal + installmentTotal;
  const displayTotal =
    hasAnyLines && computedTotal > 0 ? computedTotal : (cycle?.totalAmount ?? 0);
  const remaining = Math.max(0, displayTotal - (cycle?.paidAmount ?? 0));

  const handleRemove = (tx: Transaction) => {
    if (!cycleId || !isEditable) return;
    void removeM.mutateAsync(tx.id);
  };

  return (
    <Drawer
      side="right"
      size="xl"
      isOpen={isOpen}
      onClose={onClose}
      title={
        cycle ? billingCycleDisplayName(cycle) : "Chi tiết kỳ sao kê"
      }
      description={
        cycle
          ? `${cycle.sourceName} · ${billingCyclePeriodLabel(cycle)}`
          : undefined
      }
    >
      {detailQ.isLoading ? (
        <BillingCycleDetailSkeleton />
      ) : detailQ.isError ? (
        <p className="rounded-lg border border-danger/25 bg-danger/5 px-3 py-2 text-sm text-danger">
          Không tải được chi tiết kỳ.
        </p>
      ) : cycle ? (
        <div className="flex min-h-0 flex-col gap-5">
          {isEditable ? (
            <section className="rounded-card border border-accent/20 bg-accent/5 p-3">
              <p className="mb-3 text-sm text-warm-700">
                Kỳ đang mở — bạn có thể{" "}
                <strong>thêm giao dịch mới</strong> trên cùng thẻ, hoặc{" "}
                <strong>loại bỏ</strong> giao dịch khỏi kỳ bằng nút bên từng dòng.
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
            </section>
          ) : null}

          <dl className="grid grid-cols-2 gap-3 rounded-card border border-warm-200 bg-warm-25 px-4 py-3 text-sm sm:grid-cols-3">
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
                {transactions.length} giao dịch
                {installmentDues.length > 0
                  ? ` · ${installmentDues.length} trả góp`
                  : ""}
              </dd>
            </div>
          </dl>

          <section className="min-h-0 flex-1 space-y-4">
            {!hasAnyLines ? (
              <div className="rounded-lg border border-dashed border-warm-200 bg-warm-25/50 px-4 py-8 text-center">
                <p className="text-sm text-warm-600">Chưa có giao dịch trong kỳ này.</p>
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
            ) : (
              <>
                {transactions.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-warm-800">
                        Giao dịch trả sau
                      </h4>
                      {isEditable ? (
                        <span className="text-xs text-warm-500">
                          Nhấn dòng để xem chi tiết
                        </span>
                      ) : null}
                    </div>
                    <motion.ul
                      {...listStaggerMotion}
                      className="flex max-h-[min(320px,40vh)] flex-col gap-2 overflow-y-auto pr-1"
                    >
                      {transactions.map((tx) => (
                        <motion.li key={tx.id} {...listStaggerItemMotion}>
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
                        </motion.li>
                      ))}
                    </motion.ul>
                  </div>
                ) : null}

                {installmentDues.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-warm-800">
                        Trả góp phải thanh toán
                      </h4>
                      <span className="text-xs text-warm-500">
                        Kỳ đến hạn trong tháng sao kê
                      </span>
                    </div>
                    <motion.ul
                      {...listStaggerMotion}
                      className="flex max-h-[min(280px,35vh)] flex-col gap-2 overflow-y-auto pr-1"
                    >
                      {installmentDues.map((due) => (
                        <motion.li key={due.payId} {...listStaggerItemMotion}>
                          <BillingCycleInstallmentRow
                            due={due}
                            currency={resolvedCurrency}
                          />
                        </motion.li>
                      ))}
                    </motion.ul>
                  </div>
                ) : null}
              </>
            )}
          </section>

          <footer
            className={cn(
              "sticky bottom-0 flex flex-col gap-1.5 border-t border-warm-200 bg-surface pt-4 text-sm",
            )}
          >
            {installmentTotal > 0 ? (
              <>
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
              </>
            ) : null}
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
        </div>
      ) : null}
    </Drawer>
  );
}
