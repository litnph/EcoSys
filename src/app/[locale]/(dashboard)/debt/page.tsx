"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { Wallet } from "lucide-react";
import * as React from "react";
import { motion } from "framer-motion";

import {
  DebtPaymentModal,
  DebtRecordCard,
  DebtSummaryBar,
} from "@/features/debt/components";
import type { DebtDirection, DebtRecordListItem, DebtStatus } from "@/features/debt/types";
import {
  useDebtRecordDetail,
  useDebtRecords,
  useDebtSummary,
  useDeleteDebtRecord,
} from "@/features/debt/hooks";
import type { FinSource } from "@/features/sources/types";
import { useSources } from "@/features/sources/hooks";

import { NEXT_PUBLIC_FINANCE_SMODULE_ID } from "@/config/env";
import { PageHeader } from "@/shared/components/layouts/PageHeader";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { SkeletonCard } from "@/shared/components/ui/Skeleton";
import { cn } from "@/shared/lib/utils";
import { staggerChildren, staggerItem } from "@/shared/lib/animations";

function paymentSourceOptions(sources: FinSource[] | undefined): FinSource[] {
  return (sources ?? []).filter(
    (s) =>
      s.type === "bankAccount" || s.type === "cash" || s.type === "eWallet",
  );
}

const statusTabsClass =
  "flex gap-1 overflow-x-auto rounded-button border border-warm-200 bg-warm-50 p-1 text-sm";

const statusTriggerClass = cn(
  "shrink-0 rounded-md px-3 py-2 font-medium transition outline-none whitespace-nowrap",
  "data-[state=active]:bg-surface data-[state=active]:text-warm-900 data-[state=active]:shadow-sm",
  "data-[state=inactive]:text-warm-500 hover:text-warm-800",
);

export default function DebtPage() {
  const smoduleId = NEXT_PUBLIC_FINANCE_SMODULE_ID.trim();
  const missingModule = smoduleId.length === 0;

  const [directionTab, setDirectionTab] = React.useState<DebtDirection>("borrowed");
  const [statusFilter, setStatusFilter] = React.useState<DebtStatus>("active");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [payRecord, setPayRecord] = React.useState<DebtRecordListItem | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const summaryQ = useDebtSummary(missingModule ? undefined : smoduleId, {
    enabled: !missingModule,
  });

  const borrowedActiveQ = useDebtRecords(missingModule ? undefined : smoduleId, "borrowed", {
    enabled: !missingModule,
    status: "active",
  });
  const lentActiveQ = useDebtRecords(missingModule ? undefined : smoduleId, "lent", {
    enabled: !missingModule,
    status: "active",
  });

  const listQ = useDebtRecords(missingModule ? undefined : smoduleId, directionTab, {
    enabled: !missingModule,
    status: statusFilter,
  });

  const detailQ = useDebtRecordDetail(expandedId ?? undefined, {
    enabled: Boolean(!missingModule && expandedId),
  });

  const { data: sources } = useSources(missingModule ? undefined : smoduleId);
  const paySources = React.useMemo(
    () => paymentSourceOptions(sources),
    [sources],
  );

  const delM = useDeleteDebtRecord();

  const toggleExpand = React.useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const recordPayment = React.useCallback(
    (id: string) => {
      const row = listQ.data?.find((x) => x.id === id);
      if (row) setPayRecord(row);
    },
    [listQ.data],
  );

  const deleteDebt = React.useCallback(
    (id: string) => {
      void (async () => {
        setDeletingId(id);
        try {
          await delM.mutateAsync(id);
          setExpandedId((prev) => (prev === id ? null : prev));
        } finally {
          setDeletingId(null);
        }
      })();
    },
    [delM],
  );

  const summaryCurrency =
    borrowedActiveQ.data?.[0]?.currency ??
    lentActiveQ.data?.[0]?.currency ??
    listQ.data?.[0]?.currency ??
    "VND";

  const directionTabListClass = cn(
    "mt-6 flex gap-1 overflow-x-auto rounded-button border p-1 text-sm",
    directionTab === "borrowed"
      ? "border-danger/25 bg-danger/5"
      : "border-success/25 bg-success/5",
  );

  const directionTriggerBase = cn(
    "shrink-0 rounded-md px-4 py-2.5 font-medium transition outline-none whitespace-nowrap",
  );

  return (
    <div className="w-full max-w-[1400px] pb-24 md:pb-8">
      <PageHeader
        title="Nợ & cho vay"
        description="Theo dõi khoản bạn đang nợ và khoản bạn cho mượn. Tạo khoản mới từ giao dịch trong form giao dịch."
      />

      {missingModule ? (
        <div className="mt-8 rounded-card border border-warm-200 bg-warm-25 p-8 text-center text-sm text-warm-600 shadow-sm">
          Thiếu{" "}
          <code className="rounded bg-warm-100 px-1 py-0.5 text-warm-800">
            NEXT_PUBLIC_FINANCE_SMODULE_ID
          </code>{" "}
          trong môi trường.
        </div>
      ) : (
        <>
          <div className="mt-6">
            {summaryQ.isLoading ? (
              <SkeletonCard />
            ) : summaryQ.data ? (
              <DebtSummaryBar
                borrowedRemaining={summaryQ.data.totalBorrowedRemaining}
                lentRemaining={summaryQ.data.totalLentRemaining}
                borrowedActiveCount={borrowedActiveQ.data?.length ?? 0}
                lentActiveCount={lentActiveQ.data?.length ?? 0}
                currency={summaryCurrency}
              />
            ) : null}
          </div>

          <Tabs.Root
            value={directionTab}
            onValueChange={(v) => {
              setDirectionTab(v as DebtDirection);
              setExpandedId(null);
            }}
            className="mt-6"
          >
            <Tabs.List
              className={directionTabListClass}
              aria-label="Hướng nợ"
            >
              <Tabs.Trigger
                value="borrowed"
                className={cn(
                  directionTriggerBase,
                  "data-[state=active]:bg-danger/15 data-[state=active]:text-danger data-[state=active]:shadow-sm",
                  "data-[state=inactive]:text-warm-600 data-[state=inactive]:hover:text-danger",
                )}
              >
                Tôi đang nợ
              </Tabs.Trigger>
              <Tabs.Trigger
                value="lent"
                className={cn(
                  directionTriggerBase,
                  "data-[state=active]:bg-success/15 data-[state=active]:text-success data-[state=active]:shadow-sm",
                  "data-[state=inactive]:text-warm-600 data-[state=inactive]:hover:text-success",
                )}
              >
                Người khác nợ tôi
              </Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>

          <div className="mt-4">
            <Tabs.Root
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as DebtStatus);
                setExpandedId(null);
              }}
            >
              <Tabs.List className={statusTabsClass} aria-label="Trạng thái khoản">
                <Tabs.Trigger className={statusTriggerClass} value="active">
                  Đang xử lý
                </Tabs.Trigger>
                <Tabs.Trigger className={statusTriggerClass} value="completed">
                  Hoàn tất
                </Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>
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
                  icon={<Wallet aria-hidden className="size-14" />}
                  title="Không có khoản nợ nào"
                  description="Tốt lắm!"
                />
              </div>
            ) : (
              listQ.data?.map((item) => (
                <motion.div key={item.id} variants={staggerItem}>
                  <DebtRecordCard
                    item={item}
                    detail={
                      expandedId === item.id && detailQ.data?.id === item.id
                        ? detailQ.data
                        : undefined
                    }
                    isExpanded={expandedId === item.id}
                    isDetailLoading={
                      expandedId === item.id &&
                      (detailQ.isPending || detailQ.isFetching)
                    }
                    onToggleExpand={toggleExpand}
                    onRecordPayment={recordPayment}
                    onDelete={deleteDebt}
                    isDeleting={deletingId === item.id}
                  />
                </motion.div>
              ))
            )}
          </motion.div>
        </>
      )}

      <DebtPaymentModal
        smoduleId={smoduleId}
        record={payRecord}
        paymentSources={paySources}
        isOpen={payRecord !== null}
        onClose={() => setPayRecord(null)}
      />
    </div>
  );
}
