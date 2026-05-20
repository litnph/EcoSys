"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { useQueries } from "@tanstack/react-query";
import { CreditCard, Plus } from "lucide-react";
import * as React from "react";
import { motion } from "framer-motion";

import {
  CancelInstallmentPlanModal,
  CreateInstallmentPlanModal,
  InstallmentPaysTimeline,
  InstallmentPlanCard,
  PayInstallmentModal,
} from "@/features/installments/components";
import { installmentKeys } from "@/features/installments/api/installmentKeys";
import { getInstallmentPlanDetail } from "@/features/installments/api/installmentsApi";
import {
  useInstallmentPlans,
} from "@/features/installments/hooks";
import type {
  InstallmentPay,
  InstallmentPlanListItem,
  InstallmentStatus,
} from "@/features/installments/types";
import { useSources } from "@/features/sources/hooks";
import type { FinSource } from "@/features/sources/types";

import { PageHeader } from "@/shared/components/layouts/PageHeader";
import { MissingFinanceModule } from "@/shared/components/finance/MissingFinanceModule";
import { useFinanceSmoduleId } from "@/shared/hooks/useFinanceSmoduleId";
import { Button } from "@/shared/components/ui/Button";
import { Drawer } from "@/shared/components/ui/Drawer";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { SkeletonCard } from "@/shared/components/ui/Skeleton";
import { useMediaMd } from "@/shared/hooks/useMediaMd";
import { cn } from "@/shared/lib/utils";
import { staggerChildren, staggerItem } from "@/shared/lib/animations";

const tabListClass =
  "flex gap-1 overflow-x-auto rounded-button border border-warm-200 bg-warm-50 p-1 text-sm";

const tabTriggerClass = cn(
  "shrink-0 rounded-md px-3 py-2 font-medium transition outline-none whitespace-nowrap",
  "data-[state=active]:bg-surface data-[state=active]:text-warm-900 data-[state=active]:shadow-sm",
  "data-[state=inactive]:text-warm-500 hover:text-warm-800",
);

function pickCurrencyForPlan(
  listItem: InstallmentPlanListItem,
  sources: FinSource[] | undefined,
): string {
  const s = sources?.find((x) => x.id === listItem.sourceId);
  return s?.currency ?? "VND";
}

function paymentSourceOptions(sources: FinSource[] | undefined): FinSource[] {
  return (sources ?? []).filter(
    (s) =>
      s.type === "bankAccount" || s.type === "cash" || s.type === "eWallet",
  );
}

export default function InstallmentsPage() {
  const smoduleId = useFinanceSmoduleId();
  const missingModule = smoduleId.length === 0;
  const mdUp = useMediaMd();

  const [tab, setTab] = React.useState<InstallmentStatus>("active");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [drawerPlanId, setDrawerPlanId] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [cancelPlanId, setCancelPlanId] = React.useState<string | null>(null);
  const [payCtx, setPayCtx] = React.useState<{
    planId: string;
    pay: InstallmentPay;
  } | null>(null);

  const listQ = useInstallmentPlans(
    missingModule ? undefined : smoduleId,
    tab,
  );

  const ids = listQ.data?.map((p) => p.id) ?? [];

  const detailQueries = useQueries({
    queries: ids.map((id) => ({
      queryKey: installmentKeys.detail(id),
      queryFn: () => getInstallmentPlanDetail(id),
      enabled: !missingModule && ids.length > 0,
      staleTime: 12_000,
    })),
  });

  const planById = React.useMemo(() => {
    const m =
      new Map<string, import("@/features/installments/types").InstallmentPlan>();
    for (const q of detailQueries) {
      if (q.data) m.set(q.data.id, q.data);
    }
    return m;
  }, [detailQueries]);

  const { data: sources } = useSources(
    missingModule ? undefined : smoduleId,
  );

  const drawerPlan = drawerPlanId ? planById.get(drawerPlanId) : undefined;

  const drawerItem =
    drawerPlanId && listQ.data
      ? listQ.data.find((p) => p.id === drawerPlanId)
      : undefined;
  const drawerCurrency = drawerItem
    ? pickCurrencyForPlan(drawerItem, sources)
    : "VND";

  const handleToggleCard = (id: string) => {
    if (mdUp) {
      setExpandedId((prev) => (prev === id ? null : id));
      return;
    }
    setDrawerPlanId(id);
  };

  const handlePay = (planId: string, pay: InstallmentPay) => {
    setPayCtx({ planId, pay });
  };

  return (
    <div className="w-full max-w-[1400px] pb-24 md:pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title="Trả góp"
          description="Kế hoạch trả góp từ giao dịch quẹt thẻ, lịch từng kỳ và thanh toán."
        />
        <Button
          type="button"
          className="hidden shrink-0 sm:inline-flex"
          leftIcon={<Plus className="size-4" aria-hidden />}
          onClick={() => setCreateOpen(true)}
          disabled={missingModule}
        >
          Tạo kế hoạch
        </Button>
      </div>

      {missingModule ? (
        <MissingFinanceModule />
      ) : (
        <>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Tabs.Root
              value={tab}
              onValueChange={(v) => {
                setTab(v as InstallmentStatus);
                setExpandedId(null);
                setDrawerPlanId(null);
              }}
            >
              <Tabs.List className={tabListClass} aria-label="Trạng thái trả góp">
                <Tabs.Trigger className={tabTriggerClass} value="active">
                  Đang trả
                </Tabs.Trigger>
                <Tabs.Trigger className={tabTriggerClass} value="completed">
                  Hoàn tất
                </Tabs.Trigger>
                <Tabs.Trigger className={tabTriggerClass} value="cancelled">
                  Đã hủy
                </Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>
            <Button
              type="button"
              size="sm"
              className="sm:hidden"
              leftIcon={<Plus className="size-4" aria-hidden />}
              onClick={() => setCreateOpen(true)}
            >
              Tạo kế hoạch
            </Button>
          </div>

          <motion.div
            className="mt-6 grid gap-4 lg:grid-cols-2"
            variants={staggerChildren}
            initial="initial"
            animate="animate"
          >
            {listQ.isLoading ? (
              <>
                <motion.div variants={staggerItem}>
                  <SkeletonCard />
                </motion.div>
                <motion.div variants={staggerItem}>
                  <SkeletonCard />
                </motion.div>
              </>
            ) : (listQ.data?.length ?? 0) === 0 ? (
              <div className="lg:col-span-2">
                <EmptyState
                  icon={<CreditCard aria-hidden className="size-14" />}
                  title="Chưa có kế hoạch"
                  description="Khi có giao dịch deferred trên thẻ tín dụng, bạn có thể tạo trả góp mới."
                />
              </div>
            ) : (
              listQ.data?.map((item) => {
                const plan = planById.get(item.id) ?? null;
                const currency = pickCurrencyForPlan(item, sources);
                const expanded = expandedId === item.id;
                const detailIdx = ids.indexOf(item.id);
                const isLoadingThis =
                  detailIdx >= 0
                    ? (detailQueries[detailIdx]?.isPending ?? false)
                    : false;

                return (
                  <motion.div key={item.id} variants={staggerItem} className="flex flex-col gap-3">
                    <InstallmentPlanCard
                      listItem={item}
                      plan={plan}
                      isDetailLoading={isLoadingThis}
                      currency={currency}
                      isExpanded={mdUp ? expanded : false}
                      onToggle={() => handleToggleCard(item.id)}
                      onCancel={
                        item.status === "active"
                          ? () => setCancelPlanId(item.id)
                          : undefined
                      }
                    />
                    {mdUp && expanded && plan ? (
                      <div className="rounded-card border border-warm-200 bg-surface p-4 shadow-inner">
                        <InstallmentPaysTimeline
                          pays={plan.pays}
                          currency={currency}
                          onPay={(pay) => handlePay(item.id, pay)}
                        />
                      </div>
                    ) : null}
                  </motion.div>
                );
              })
            )}
          </motion.div>

          <Drawer
            side="right"
            isOpen={Boolean(!mdUp && drawerPlanId)}
            onClose={() => setDrawerPlanId(null)}
            title="Lịch trả góp"
            description={drawerPlan?.originalTxnDescription ?? undefined}
            size="lg"
          >
            {drawerPlanId && !drawerPlan ? (
              <div className="relative pl-6" aria-busy="true">
                <div
                  className="pointer-events-none absolute left-[7px] top-2 bottom-8 w-px bg-warm-200"
                  aria-hidden
                />
                <motion.div
                  variants={staggerChildren}
                  initial="initial"
                  animate="animate"
                  className="flex flex-col gap-4"
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i} variants={staggerItem}>
                      <SkeletonCard lines={3} />
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            ) : drawerPlan ? (
              <InstallmentPaysTimeline
                pays={drawerPlan.pays}
                currency={drawerCurrency}
                onPay={(pay) => {
                  if (drawerPlanId) handlePay(drawerPlanId, pay);
                }}
              />
            ) : null}
          </Drawer>
        </>
      )}

      <CreateInstallmentPlanModal
        smoduleId={smoduleId}
        sources={sources}
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      <CancelInstallmentPlanModal
        planId={cancelPlanId}
        isOpen={cancelPlanId !== null}
        onClose={() => setCancelPlanId(null)}
      />

      <PayInstallmentModal
        planId={payCtx?.planId ?? null}
        pay={payCtx?.pay ?? null}
        paymentSources={paymentSourceOptions(sources)}
        currency={(() => {
          if (!payCtx) return "VND";
          const li = listQ.data?.find((p) => p.id === payCtx.planId);
          if (li) return pickCurrencyForPlan(li, sources);
          const pl = planById.get(payCtx.planId);
          return sources?.find((s) => s.id === pl?.sourceId)?.currency ?? "VND";
        })()}
        isOpen={payCtx !== null}
        onClose={() => setPayCtx(null)}
      />
    </div>
  );
}
