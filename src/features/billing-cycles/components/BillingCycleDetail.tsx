"use client";

import { motion } from "framer-motion";

import { TransactionItem } from "@/features/transactions/components/TransactionItem";
import type { Transaction } from "@/features/transactions/types";

import { Drawer } from "@/shared/components/ui/Drawer";
import { SkeletonText } from "@/shared/components/ui/Skeleton";
import { formatCurrency, formatDate } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";
import { staggerChildren, staggerItem } from "@/shared/lib/animations";

import { useBillingCycleDetail } from "../hooks/useBillingCycles";

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
}

export function BillingCycleDetail({
  cycleId,
  currency,
  isOpen,
  onClose,
  onOpenTransaction,
}: BillingCycleDetailProps) {
  const detailQ = useBillingCycleDetail(cycleId, isOpen);
  const resolvedCurrency =
    detailQ.data?.transactions[0]?.currency ?? currency;

  return (
    <Drawer
      side="right"
      size="lg"
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết kỳ sao kê"
      description={
        detailQ.data
          ? `${detailQ.data.cycle.sourceName} · ${formatDate(detailQ.data.cycle.periodStart)} — ${formatDate(detailQ.data.cycle.periodEnd)}`
          : undefined
      }
    >
      {detailQ.isLoading ? (
        <BillingCycleDetailSkeleton />
      ) : detailQ.isError ? (
        <p className="rounded-lg border border-danger/25 bg-danger/5 px-3 py-2 text-sm text-danger">
          Không tải được chi tiết kỳ.
        </p>
      ) : detailQ.data ? (
        <div className="flex flex-col gap-6">
          <dl className="grid grid-cols-2 gap-3 rounded-card border border-warm-200 bg-warm-25 px-4 py-3 text-sm">
            <div>
              <dt className="text-warm-500">Ngày sao kê</dt>
              <dd className="font-medium text-warm-900 tabular-nums">
                {formatDate(detailQ.data.cycle.statementDate)}
              </dd>
            </div>
            <div>
              <dt className="text-warm-500">Hạn thanh toán</dt>
              <dd className="font-medium text-warm-900 tabular-nums">
                {formatDate(detailQ.data.cycle.paymentDueDate)}
              </dd>
            </div>
          </dl>

          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-warm-800">
              Giao dịch trong kỳ
            </h4>
            <div className="flex flex-col gap-2">
              {detailQ.data.transactions.length === 0 ? (
                <p className="text-sm text-warm-500">Chưa có giao dịch.</p>
              ) : (
                <motion.div
                  variants={staggerChildren}
                  initial="initial"
                  animate="animate"
                  className="flex flex-col gap-2"
                >
                  {detailQ.data.transactions.map((tx) => (
                    <motion.div key={tx.id} variants={staggerItem}>
                      <TransactionItem
                        transaction={tx}
                        onOpen={onOpenTransaction}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </section>

          <footer
            className={cn(
              "sticky bottom-0 flex flex-col gap-1 border-t border-warm-200 bg-surface pt-4 text-sm")}
          >
            <div className="flex items-center justify-between font-medium text-warm-700">
              <span>Tổng phát sinh</span>
              <span className="font-mono tabular-nums text-warm-900">
                {formatCurrency(detailQ.data.cycle.totalAmount, resolvedCurrency)}
              </span>
            </div>
            <div className="flex items-center justify-between text-warm-600">
              <span>Đã thanh toán</span>
              <span className="font-mono tabular-nums">
                {formatCurrency(detailQ.data.cycle.paidAmount, resolvedCurrency)}
              </span>
            </div>
          </footer>
        </div>
      ) : null}
    </Drawer>
  );
}
