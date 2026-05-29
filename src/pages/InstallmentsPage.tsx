import * as Tabs from "@radix-ui/react-tabs";
import { Plus } from "lucide-react";
import * as React from "react";

import {
  CancelInstallmentPlanModal,
  DeleteInstallmentPlanModal,
  CreateInstallmentPlanModal,
  InstallmentPlanDetailModal,
  InstallmentPlanListPanel,
  InstallmentSchedulePanel,
  InstallmentsOverview,
  PayInstallmentModal,
} from "@/features/installments/components";
import {
  useInstallmentDashboard,
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
import { Button } from "@/shared/components/ui/Button";
import { cn } from "@/shared/lib/utils";

type MainTab = "overview" | "schedule" | "plans";

const mainTabListClass =
  "flex gap-1 overflow-x-auto rounded-button border border-warm-200 bg-warm-50 p-1 text-sm";

const mainTabTriggerClass = cn(
  "shrink-0 rounded-md px-4 py-2 font-medium transition outline-none whitespace-nowrap",
  "data-[state=active]:bg-surface data-[state=active]:text-warm-900 data-[state=active]:shadow-sm",
  "data-[state=inactive]:text-warm-500 hover:text-warm-800");

function pickCurrencyForPlan(
  listItem: InstallmentPlanListItem,
  sources: FinSource[] | undefined): string {
  const s = sources?.find((x) => x.id === listItem.sourceId);
  return s?.currency ?? "VND";
}

function paymentSourceOptions(sources: FinSource[] | undefined): FinSource[] {
  return (sources ?? []).filter(
    (s) =>
      s.type === "bankAccount" || s.type === "cash" || s.type === "eWallet");
}

export function InstallmentsPage() {
  const [mainTab, setMainTab] = React.useState<MainTab>("overview");
  const [planStatus, setPlanStatus] = React.useState<InstallmentStatus>("active");
  const [detailPlanId, setDetailPlanId] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [cancelPlanId, setCancelPlanId] = React.useState<string | null>(null);
  const [deletePlanId, setDeletePlanId] = React.useState<string | null>(null);
  const [payCtx, setPayCtx] = React.useState<{
    planId: string;
    pay: InstallmentPay;
  } | null>(null);

  const dashboardQ = useInstallmentDashboard();
  const activePlansQ = useInstallmentPlans("active");
  const listQ = useInstallmentPlans(planStatus);
  const { data: sources } = useSources();

  const detailListItem =
    listQ.data?.find((p) => p.id === detailPlanId) ??
    activePlansQ.data?.find((p) => p.id === detailPlanId) ??
    null;

  const deleteListItem =
    listQ.data?.find((p) => p.id === deletePlanId) ??
    activePlansQ.data?.find((p) => p.id === deletePlanId) ??
    null;

  const handlePay = (planId: string, pay: InstallmentPay) => {
    setPayCtx({ planId, pay });
  };

  const handleOpenDetail = (id: string) => {
    setDetailPlanId(id);
  };

  const handleCloseDetail = () => {
    setDetailPlanId(null);
  };

  const handleDeleteFromCard = (id: string) => {
    setDeletePlanId(id);
  };

  const handleDeleteFromDetail = () => {
    if (!detailPlanId) return;
    setDeletePlanId(detailPlanId);
    handleCloseDetail();
  };

  const handleCancelFromDetail = () => {
    if (!detailPlanId) return;
    setCancelPlanId(detailPlanId);
    handleCloseDetail();
  };

  const defaultCurrency = sources?.[0]?.currency ?? "VND";

  const detailStatus =
    detailListItem?.status ??
    (activePlansQ.data?.some((p) => p.id === detailPlanId) ? "active" : undefined);

  return (
    <div className="w-full max-w-[1400px] pb-8">
      <div className="flex flex-row items-end justify-between gap-4">
        <PageHeader
          title="Trả góp"
          description="Kế hoạch trả góp từ giao dịch quẹt thẻ, lịch từng kỳ và thanh toán."
        />
        <Button
          type="button"
          className="shrink-0"
          leftIcon={<Plus className="size-4" aria-hidden />}
          onClick={() => setCreateOpen(true)}
        >
          Tạo kế hoạch
        </Button>
      </div>

      <Tabs.Root
        className="mt-6"
        value={mainTab}
        onValueChange={(v) => setMainTab(v as MainTab)}
      >
        <Tabs.List
          className={mainTabListClass}
          aria-label="Trả góp"
        >
          <Tabs.Trigger className={mainTabTriggerClass} value="overview">
            Tổng quan
          </Tabs.Trigger>
          <Tabs.Trigger className={mainTabTriggerClass} value="schedule">
            Lịch thanh toán
          </Tabs.Trigger>
          <Tabs.Trigger className={mainTabTriggerClass} value="plans">
            Danh sách kế hoạch
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="overview" className="mt-6 outline-none">
          <InstallmentsOverview
            data={dashboardQ.data}
            currency={defaultCurrency}
            isLoading={dashboardQ.isLoading}
          />
        </Tabs.Content>

        <Tabs.Content value="schedule" className="mt-6 outline-none">
          <InstallmentSchedulePanel
            data={dashboardQ.data}
            currency={defaultCurrency}
            isLoading={dashboardQ.isLoading}
            onOpenPlan={handleOpenDetail}
          />
        </Tabs.Content>

        <Tabs.Content value="plans" className="mt-6 outline-none">
          <InstallmentPlanListPanel
            items={listQ.data}
            sources={sources}
            status={planStatus}
            onStatusChange={setPlanStatus}
            isLoading={listQ.isLoading}
            onOpenDetail={handleOpenDetail}
            onDelete={handleDeleteFromCard}
          />
        </Tabs.Content>
      </Tabs.Root>

      <InstallmentPlanDetailModal
        planId={detailPlanId}
        listItem={detailListItem}
        currency={
          detailListItem
            ? pickCurrencyForPlan(detailListItem, sources)
            : defaultCurrency
        }
        isOpen={detailPlanId !== null}
        onClose={handleCloseDetail}
        onPay={handlePay}
        onDelete={
          detailListItem?.canDelete ? handleDeleteFromDetail : undefined
        }
        onCancel={
          detailStatus === "active" ? handleCancelFromDetail : undefined
        }
      />

      <CreateInstallmentPlanModal
        sources={sources}
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      <CancelInstallmentPlanModal
        planId={cancelPlanId}
        isOpen={cancelPlanId !== null}
        onClose={() => setCancelPlanId(null)}
      />

      <DeleteInstallmentPlanModal
        planId={deletePlanId}
        planTitle={
          deleteListItem?.originalTxnCategoryName?.trim() ||
          deleteListItem?.originalTxnDescription?.trim() ||
          null
        }
        isOpen={deletePlanId !== null}
        onClose={() => setDeletePlanId(null)}
      />

      <PayInstallmentModal
        planId={payCtx?.planId ?? null}
        pay={payCtx?.pay ?? null}
        paymentSources={paymentSourceOptions(sources)}
        currency={(() => {
          if (!payCtx) return defaultCurrency;
          const li =
            listQ.data?.find((p) => p.id === payCtx.planId) ??
            activePlansQ.data?.find((p) => p.id === payCtx.planId);
          return li ? pickCurrencyForPlan(li, sources) : defaultCurrency;
        })()}
        isOpen={payCtx !== null}
        onClose={() => setPayCtx(null)}
      />
    </div>
  );
}
