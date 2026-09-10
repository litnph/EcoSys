import { ArrowLeft } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import {
  AddCycleTransactionModal,
  BillingCycleDetail,
  StatementReconciliationPanel,
} from "@/features/billing-cycles/components";
import { useBillingCycleDetail, useRefreshCycle } from "@/features/billing-cycles/hooks";
import type { StatementReconciliationResult } from "@/features/billing-cycles/reconciliation";
import { billingCycleDisplayName, billingCyclePeriodLabel } from "@/features/billing-cycles/utils/billingCycleDisplay";
import { useSources } from "@/features/sources/hooks";
import { TransactionDetailDrawer } from "@/features/transactions/components/TransactionDetailDrawer";
import type { Transaction } from "@/features/transactions/types";
import { ROUTES } from "@/config/routes";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/shared/components/layouts/PageHeader";
import { SkeletonCard } from "@/shared/components/ui/Skeleton";

export function BillingCycleDetailPage() {
  const { cycleId } = useParams<{ cycleId: string }>();
  const detailQ = useBillingCycleDetail(cycleId ?? null, Boolean(cycleId));
  const sourcesQ = useSources();
  const refreshM = useRefreshCycle();
  const [addTxnOpen, setAddTxnOpen] = useState(false);
  const [txnDrawerId, setTxnDrawerId] = useState<string | null>(null);
  const [txnPreview, setTxnPreview] = useState<Transaction | null>(null);
  const [reconciliation, setReconciliation] =
    useState<StatementReconciliationResult | null>(null);

  const cycle = detailQ.data?.cycle;
  const currency = useMemo(() => {
    const sourceCurrency = sourcesQ.data?.find(
      (source) => source.id === cycle?.sourceId,
    )?.currency;
    return detailQ.data?.transactions[0]?.currency ?? sourceCurrency ?? "VND";
  }, [cycle?.sourceId, detailQ.data?.transactions, sourcesQ.data]);
  const mismatchDates = useMemo(
    () => new Set(reconciliation?.mismatchDates ?? []),
    [reconciliation?.mismatchDates],
  );
  const handleReconciliationChange = useCallback(
    (result: StatementReconciliationResult | null) => {
      setReconciliation(result);
    },
    [],
  );

  const openTransaction = (transaction: Transaction) => {
    setTxnPreview(transaction);
    setTxnDrawerId(transaction.id);
  };

  const closeTransaction = () => {
    setTxnDrawerId(null);
    setTxnPreview(null);
  };

  return (
    <div className="w-full pb-8">
      <Link
        href={ROUTES.dashboard.billing}
        className="mb-4 inline-flex items-center gap-2 text-sm text-warm-600 transition hover:text-accent"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Kỳ sao kê thẻ
      </Link>

      <PageHeader
        title={cycle ? billingCycleDisplayName(cycle) : "Chi tiết kỳ sao kê"}
        description={
          cycle
            ? `${cycle.sourceName} · ${billingCyclePeriodLabel(cycle)}`
            : "Giao dịch trả sau, trả góp và đối chiếu file sao kê."
        }
      />

      {detailQ.isLoading ? (
        <div className="space-y-5" aria-busy="true">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={5} />
        </div>
      ) : detailQ.isError || !detailQ.data ? (
        <div className="rounded-card border border-danger/25 bg-danger/5 px-4 py-4 text-sm text-danger">
          Không tải được chi tiết kỳ sao kê. Kỳ có thể đã bị xóa hoặc bạn không
          có quyền truy cập.
        </div>
      ) : (
        <div className="space-y-6">
          <StatementReconciliationPanel
            cycle={detailQ.data.cycle}
            transactions={detailQ.data.transactions}
            installmentDues={detailQ.data.installmentDues}
            currency={currency}
            onResultChange={handleReconciliationChange}
          />
          <BillingCycleDetail
            detail={detailQ.data}
            currency={currency}
            mismatchDates={mismatchDates}
            onOpenTransaction={openTransaction}
            onRefresh={() => {
              refreshM.mutate(detailQ.data.cycle.id);
            }}
            isRefreshing={
              refreshM.isPending &&
              refreshM.variables === detailQ.data.cycle.id
            }
            onAddTransaction={
              detailQ.data.cycle.status === "open"
                ? () => setAddTxnOpen(true)
                : undefined
            }
          />
        </div>
      )}

      <AddCycleTransactionModal
        cycle={detailQ.data?.cycle ?? null}
        isOpen={addTxnOpen}
        onClose={() => setAddTxnOpen(false)}
      />

      <TransactionDetailDrawer
        transactionId={txnDrawerId}
        isOpen={txnDrawerId != null}
        onClose={closeTransaction}
        listPreview={txnPreview}
      />
    </div>
  );
}
