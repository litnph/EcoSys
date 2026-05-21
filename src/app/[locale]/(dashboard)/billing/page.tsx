"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { CreditCard, PlusCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import {
  BillingCycleCard,
  BillingCycleDetail,
  CloseCycleModal,
  PayCycleModal,
} from "@/features/billing-cycles/components";
import {
  useBillingCycles,
  useGenerateCycle,
} from "@/features/billing-cycles/hooks";
import type { BillingCycle } from "@/features/billing-cycles/types";
import { TransactionDetailDrawer } from "@/features/transactions/components/TransactionDetailDrawer";
import type { Transaction } from "@/features/transactions/types";
import { useSources } from "@/features/sources/hooks";
import type { FinSource } from "@/features/sources/types";

import { PageHeader } from "@/shared/components/layouts/PageHeader";
import { Button } from "@/shared/components/ui/Button";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { SkeletonCard } from "@/shared/components/ui/Skeleton";
import { cn } from "@/shared/lib/utils";
import { listStaggerItemMotion, listStaggerMotion } from "@/shared/lib/animations";

const tabListClass =
  "flex gap-1 overflow-x-auto rounded-button border border-warm-200 bg-warm-50 p-1 text-sm";

const tabTriggerClass = cn(
  "shrink-0 rounded-md px-3 py-2 font-medium transition outline-none whitespace-nowrap",
  "data-[state=active]:bg-surface data-[state=active]:text-warm-900 data-[state=active]:shadow-sm",
  "data-[state=inactive]:text-warm-500 hover:text-warm-800");

export default function BillingPage() {
  const { data: sources, isLoading: sourcesLoading } = useSources();

  const creditCards = useMemo(
    () => (sources ?? []).filter((s) => s.type === "creditCard"),
    [sources]);

  const [tab, setTab] = useState("");

  useEffect(() => {
    if (tab !== "") return;
    const firstId = creditCards[0]?.id;
    if (firstId) setTab(firstId);
  }, [tab, creditCards]);

  const activeCard = useMemo(() => {
    if (creditCards.length === 0) return undefined;
    const found = creditCards.find((c) => c.id === tab);
    return found ?? creditCards[0];
  }, [creditCards, tab]);

  const cyclesQ = useBillingCycles(activeCard?.id);

  const sortedCycles = useMemo(() => {
    const rows = cyclesQ.data ?? [];
    return [...rows].sort((a, b) => b.periodStart.localeCompare(a.periodStart));
  }, [cyclesQ.data]);

  const hasOpenCycle = sortedCycles.some((c) => c.status === "open");
  const generateM = useGenerateCycle();

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [closeTarget, setCloseTarget] = useState<BillingCycle | null>(null);
  const [payTarget, setPayTarget] = useState<BillingCycle | null>(null);
  const [txnDrawerId, setTxnDrawerId] = useState<string | null>(null);
  const [txnPreview, setTxnPreview] = useState<Transaction | null>(null);

  const paymentSourcesForPay = useMemo(() => {
    if (!sources || !payTarget) return [];
    return sources.filter((s) => s.id !== payTarget.sourceId);
  }, [sources, payTarget]);

  const payCurrency = useMemo(() => {
    if (!payTarget || !sources) return activeCard?.currency ?? "VND";
    return (
      sources.find((s) => s.id === payTarget.sourceId)?.currency ??
      activeCard?.currency ??
      "VND"
    );
  }, [payTarget, sources, activeCard]);

  const openCycleDetail = (c: BillingCycle) => {
    setDetailId(c.id);
    setDetailOpen(true);
  };

  const closeCycleDetail = () => {
    setDetailOpen(false);
    setDetailId(null);
  };

  const openTxnFromCycle = (tx: Transaction) => {
    setTxnPreview(tx);
    setTxnDrawerId(tx.id);
  };

  const closeTxnDrawer = () => {
    setTxnDrawerId(null);
    setTxnPreview(null);
  };

  return (
    <div className="w-full max-w-[1400px] pb-8">
      <PageHeader
        title="Kỳ sao kê thẻ"
        description="Theo dõi kỳ hoạch toán, đóng sao kê và thanh toán cho từng thẻ tín dụng."
      />

      {sourcesLoading ? (
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={`sk-${String(i)}`} lines={3} />
          ))}
        </div>
      ) : creditCards.length === 0 ? (
        <div className="mt-8 rounded-card border border-warm-200 bg-surface shadow-sm">
          <EmptyState
            icon={<CreditCard aria-hidden />}
            title="Chưa có thẻ tín dụng"
            description="Thêm thẻ trong mục Nguồn tài chính để quản lý kỳ sao kê."
          />
        </div>
      ) : (
        <Tabs.Root
          className="mt-8 flex flex-col gap-6"
          value={tab || creditCards[0]?.id}
          onValueChange={(v) => setTab(v)}
        >
          <Tabs.List className={tabListClass} aria-label="Thẻ tín dụng">
            {creditCards.map((c: FinSource) => (
              <Tabs.Trigger
                key={c.id}
                value={c.id}
                className={tabTriggerClass}
              >
                {c.name}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {creditCards.map((card: FinSource) => (
            <Tabs.Content key={card.id} value={card.id} className="outline-none">
              {card.id === activeCard?.id ? (
                <section className="space-y-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-warm-600">
                      Kỳ cho thẻ{" "}
                      <span className="font-medium text-warm-900">{card.name}</span>
                    </p>
                    {!hasOpenCycle ? (
                      <Button
                        type="button"
                        size="sm"
                        leftIcon={<PlusCircle className="size-4" aria-hidden />}
                        isLoading={generateM.isPending}
                        onClick={() => generateM.mutate(card.id)}
                      >
                        Tạo kỳ sao kê
                      </Button>
                    ) : null}
                  </div>

                  {cyclesQ.isLoading ? (
                    <motion.div
                      className="grid grid-cols-1 gap-4 md:grid-cols-2"
                      {...listStaggerMotion}
                    >
                      <motion.div {...listStaggerItemMotion}>
                        <SkeletonCard lines={3} />
                      </motion.div>
                      <motion.div {...listStaggerItemMotion}>
                        <SkeletonCard lines={3} />
                      </motion.div>
                    </motion.div>
                  ) : cyclesQ.isError ? (
                    <p className="rounded-lg border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">
                      Không tải được danh sách kỳ. Vui lòng thử lại.
                    </p>
                  ) : sortedCycles.length === 0 ? (
                    <EmptyState
                      icon={<CreditCard aria-hidden />}
                      title="Chưa có kỳ sao kê"
                      description='Nhấn "Tạo kỳ sao kê" để mở kỳ hoạch toán mới cho thẻ này.'
                    />
                  ) : (
                    <motion.div
                      className="grid grid-cols-1 gap-4 md:grid-cols-2"
                      {...listStaggerMotion}
                    >
                      {sortedCycles.map((c) => (
                        <motion.div key={c.id} {...listStaggerItemMotion}>
                          <BillingCycleCard
                            cycle={c}
                            currency={card.currency}
                            onOpenDetail={openCycleDetail}
                            onPay={setPayTarget}
                            onCloseCycle={setCloseTarget}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </section>
              ) : null}
            </Tabs.Content>
          ))}
        </Tabs.Root>
      )}

      <BillingCycleDetail
        cycleId={detailId}
        currency={activeCard?.currency ?? "VND"}
        isOpen={detailOpen}
        onClose={closeCycleDetail}
        onOpenTransaction={openTxnFromCycle}
      />

      <CloseCycleModal
        cycle={closeTarget}
        isOpen={closeTarget != null}
        onClose={() => setCloseTarget(null)}
      />

      <PayCycleModal
        cycle={payTarget}
        paymentSources={paymentSourcesForPay}
        currency={payCurrency}
        isOpen={payTarget != null}
        onClose={() => setPayTarget(null)}
      />

      <TransactionDetailDrawer
        transactionId={txnDrawerId}
        isOpen={txnDrawerId != null}
        onClose={closeTxnDrawer}
        listPreview={txnPreview}
      />
    </div>
  );
}
