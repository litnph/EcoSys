import { ArrowLeft, RefreshCw, SlidersHorizontal } from "lucide-react";
import * as React from "react";

import {
  BalanceAdjustmentModal,
  RecalculateSourceConfirmModal,
  SourceBalanceLedgerTable,
} from "@/features/sources/components";
import { useSourceBalanceLedger } from "@/features/sources/hooks/useSourceBalanceLedger";
import { useSources } from "@/features/sources/hooks";
import { supportsBalanceLedger } from "@/features/sources/utils/assetSource";

import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/config/routes";
import { PageHeader } from "@/shared/components/layouts/PageHeader";
import { Button } from "@/shared/components/ui/Button";
import { AsyncStateError } from "@/shared/components/ui/AsyncStateError";
import { SkeletonCard } from "@/shared/components/ui/Skeleton";
import { formatCurrency } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";

export interface SourceBalanceLedgerPageProps {
  sourceId: string;
}

export function SourceBalanceLedgerPage({ sourceId }: SourceBalanceLedgerPageProps) {
  const ledgerQ = useSourceBalanceLedger(sourceId);
  const sourcesQ = useSources();
  const [adjustOpen, setAdjustOpen] = React.useState(false);
  const [recalOpen, setRecalOpen] = React.useState(false);

  const source = sourcesQ.data?.find((s) => s.id === sourceId);
  const ledger = ledgerQ.data;

  if (source && !supportsBalanceLedger(source.type)) {
    return (
      <div className="w-full pb-8">
        <Link
          href={ROUTES.dashboard.sources}
          className="mb-4 inline-flex items-center gap-2 text-sm text-warm-600 hover:text-accent"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Quay lại nguồn
        </Link>
        <p className="text-sm text-warm-600">
          Thẻ tín dụng theo dõi qua hạn mức, không dùng sổ số dư.
        </p>
      </div>
    );
  }

  const currency = ledger?.currency ?? source?.currency ?? "VND";
  const hasDrift = ledger != null && ledger.drift !== 0;

  return (
    <div className="w-full pb-8">
      <Link
        href={ROUTES.dashboard.sources}
        className="mb-4 inline-flex items-center gap-2 text-sm text-warm-600 hover:text-accent"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Nguồn tài chính
      </Link>

      <PageHeader
        title={ledger?.sourceName ?? source?.name ?? "Sổ số dư"}
        description="Lịch sử biến động số dư theo ngày giao dịch, dùng để truy vết và đối soát."
        actions={<div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            leftIcon={<SlidersHorizontal className="size-4" aria-hidden />}
            onClick={() => setAdjustOpen(true)}
          >
            Điều chỉnh
          </Button>
          <Button
            type="button"
            variant="ghost"
            leftIcon={<RefreshCw className="size-4" aria-hidden />}
            onClick={() => setRecalOpen(true)}
          >
            Đối soát
          </Button>
        </div>}
      />

      {ledgerQ.isLoading ? (
        <div className="mt-6">
          <SkeletonCard lines={4} />
        </div>
      ) : ledgerQ.isError ? (
        <AsyncStateError title="Không tải được sổ số dư" onRetry={() => void ledgerQ.refetch()} />
      ) : ledger ? (
        <>
          <dl className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-card border border-warm-200 bg-warm-200 sm:grid-cols-3">
            <div className="bg-surface p-4">
              <dt className="text-xs text-warm-500">Số dư hiện tại</dt>
              <dd className="font-mono text-lg font-semibold tabular-nums">
                {formatCurrency(ledger.storedBalance, currency)}
              </dd>
            </div>
            <div className="bg-surface p-4">
              <dt className="text-xs text-warm-500">Tính từ sổ</dt>
              <dd className="font-mono text-lg font-semibold tabular-nums">
                {formatCurrency(ledger.computedBalance, currency)}
              </dd>
            </div>
            <div className="bg-surface p-4">
              <dt className="text-xs text-warm-500">Chênh lệch</dt>
              <dd
                className={cn(
                  "font-mono text-lg font-semibold tabular-nums",
                  hasDrift ? "text-warning" : "text-success")}
              >
                {formatCurrency(ledger.drift, currency)}
              </dd>
            </div>
          </dl>

          {hasDrift ? (
            <p
              className="mt-3 rounded-button border border-warning/35 bg-warning/10 px-3 py-2 text-sm text-warm-800"
              role="alert"
            >
              Chênh lệch đang khác 0. Dùng “Đối soát” hoặc “Điều chỉnh” để khớp với số dư thực tế.
            </p>
          ) : null}

          <div className="mt-6">
            <SourceBalanceLedgerTable
              entries={ledger.entries}
              currency={currency}
            />
          </div>
        </>
      ) : null}

      <BalanceAdjustmentModal
        sourceId={sourceId}
        currency={currency}
        storedBalance={ledger?.storedBalance}
        computedBalance={ledger?.computedBalance}
        drift={ledger?.drift}
        isOpen={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        onApplied={() => {
          void ledgerQ.refetch();
        }}
      />

      {ledger ? (
        <RecalculateSourceConfirmModal
          sourceId={sourceId}
          sourceName={ledger.sourceName}
          currency={currency}
          storedBalance={ledger.storedBalance}
          computedBalance={ledger.computedBalance}
          drift={ledger.drift}
          creditLimit={source?.creditLimit}
          isOpen={recalOpen}
          onClose={() => setRecalOpen(false)}
          onApplied={() => void ledgerQ.refetch()}
        />
      ) : null}
    </div>
  );
}
