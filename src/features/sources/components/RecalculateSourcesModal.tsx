import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import * as React from "react";

import { sourceTypeIcon } from "@/features/dashboard/utils/financeDisplay";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";
import { SkeletonText } from "@/shared/components/ui/Skeleton";
import { cn } from "@/shared/lib/utils";
import { formatCurrency } from "@/shared/lib/formatters";

import {
  useApplySourcesRecalculate,
  useSourcesRecalculatePreview,
} from "../hooks/useSourcesRecalculate";
import type { SourceRecalculatePreviewItem } from "../types/recalculate";
import { creditSourceBreakdown } from "../utils/creditSourceBreakdown";
import { sourceTypeLabelVi } from "../utils/sourceLabels";

import { CreditLimitBar } from "./CreditLimitBar";

function isCreditCardRow(row: SourceRecalculatePreviewItem): boolean {
  return row.type === "creditCard" && row.creditLimit != null && row.creditLimit > 0;
}

function previewAsSource(row: SourceRecalculatePreviewItem, balance: number) {
  return {
    id: row.sourceId,
    name: row.name,
    type: row.type,
    balance,
    creditLimit: row.creditLimit,
    statementDay: null,
    paymentDueDay: null,
    minInstallmentAmt: null,
    currency: row.currency,
    icon: null,
    color: null,
    sortOrder: 0,
    installmentRemainingAmount: row.installmentRemainingAmount,
  };
}

function formatDriftShort(drift: number, currency: string): string {
  if (drift === 0) return "Khớp";
  const sign = drift > 0 ? "+" : "";
  return `${sign}${formatCurrency(drift, currency)}`;
}

interface RecalculateSourceRowProps {
  row: SourceRecalculatePreviewItem;
  checked: boolean;
  onToggle: () => void;
}

function RecalculateSourceRow({
  row,
  checked,
  onToggle,
}: RecalculateSourceRowProps) {
  const isCard = isCreditCardRow(row);
  const TypeIcon = sourceTypeIcon(row.type);
  const hasDrift = row.drift !== 0;
  const stored = isCard ? Math.max(0, row.storedBalance) : row.storedBalance;
  const computed = isCard ? Math.max(0, row.computedBalance) : row.computedBalance;
  const breakdown = isCard
    ? creditSourceBreakdown(previewAsSource(row, row.computedBalance))
    : null;

  return (
    <label
      className={cn(
        "flex cursor-pointer gap-2.5 rounded-lg border px-2.5 py-2 transition-colors",
        checked
          ? "border-accent/30 bg-accent/[0.04]"
          : "border-warm-200 bg-surface hover:bg-warm-50/80",
        hasDrift && !checked && "border-warning/20")}
    >
      <input
        type="checkbox"
        checked={checked}
        aria-label={`Chọn ${row.name}`}
        onChange={onToggle}
        className="mt-0.5 size-3.5 shrink-0 rounded border-warm-300 text-accent"
      />

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <TypeIcon className="size-3.5 shrink-0 text-warm-500" aria-hidden />
          <span className="truncate text-sm font-medium text-warm-900">
            {row.name}
          </span>
          <span className="text-[11px] text-warm-400">
            {sourceTypeLabelVi(row.type)}
          </span>
          {hasDrift ? (
            <Badge size="sm" variant="warning" className="ml-auto shrink-0">
              {formatDriftShort(row.drift, row.currency)}
            </Badge>
          ) : (
            <Badge size="sm" variant="success" className="ml-auto shrink-0">
              Khớp
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-mono tabular-nums text-warm-600">
            {formatCurrency(stored, row.currency)}
          </span>
          <ArrowRight className="size-3 text-warm-300" aria-hidden />
          <span className="font-mono font-semibold tabular-nums text-accent">
            {formatCurrency(computed, row.currency)}
          </span>
        </div>

        {breakdown ? (
          <div className="space-y-1">
            <CreditLimitBar
              spentPct={breakdown.bar.spentPct}
              installmentPct={breakdown.bar.installmentPct}
              availablePct={breakdown.bar.availablePct}
              className="h-1.5"
            />
            <p className="text-[11px] tabular-nums text-warm-500">
              Chi {formatCurrency(breakdown.spentAmount, row.currency)}
              {" · "}TG {formatCurrency(breakdown.installmentAmount, row.currency)}
              {" · "}KD {formatCurrency(breakdown.availableAmount, row.currency)}
            </p>
          </div>
        ) : null}
      </div>
    </label>
  );
}

export interface RecalculateSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RecalculateSourcesModal({
  isOpen,
  onClose,
}: RecalculateSourcesModalProps) {
  const previewQ = useSourcesRecalculatePreview(isOpen);
  const applyM = useApplySourcesRecalculate();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [showDriftOnly, setShowDriftOnly] = React.useState(false);
  const initialized = React.useRef(false);

  React.useEffect(() => {
    if (!isOpen) {
      initialized.current = false;
      setSelected(new Set());
      setShowDriftOnly(false);
      return;
    }
    if (previewQ.data && !initialized.current) {
      initialized.current = true;
      const withDrift = previewQ.data
        .filter((row) => row.drift !== 0)
        .map((row) => row.sourceId);
      setSelected(new Set(withDrift));
      setShowDriftOnly(
        withDrift.length > 0 && withDrift.length < previewQ.data.length,
      );
    }
  }, [isOpen, previewQ.data]);

  const rows = previewQ.data ?? [];
  const visibleRows = showDriftOnly
    ? rows.filter((row) => row.drift !== 0)
    : rows;
  const driftCount = rows.filter((row) => row.drift !== 0).length;
  const allVisibleSelected =
    visibleRows.length > 0 &&
    visibleRows.every((row) => selected.has(row.sourceId));

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        for (const row of visibleRows) next.delete(row.sourceId);
      } else {
        for (const row of visibleRows) next.add(row.sourceId);
      }
      return next;
    });
  };

  const handleApply = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    try {
      await applyM.mutateAsync(ids);
      onClose();
    } catch {
      /* toast in hook */
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="reCal"
      description="So sánh số lưu và số tính lại."
      size="lg"
    >
      <div className="flex flex-col gap-3">
        {previewQ.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <SkeletonText key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : previewQ.isError ? (
          <p className="py-6 text-center text-sm text-danger">
            Không tải được bản xem trước.
          </p>
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-warm-500">
            Chưa có nguồn tài chính.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-warm-500">
              <span className="inline-flex items-center gap-2">
                {driftCount > 0 ? (
                  <>
                    <AlertTriangle className="size-3.5 text-warning" aria-hidden />
                    {String(driftCount)} lệch
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3.5 text-success" aria-hidden />
                    Tất cả khớp
                  </>
                )}
                <span>· Chọn {String(selected.size)}/{String(rows.length)}</span>
              </span>
              <span className="flex gap-2">
                {driftCount > 0 && driftCount < rows.length ? (
                  <button
                    type="button"
                    onClick={() => setShowDriftOnly((v) => !v)}
                    className="text-accent hover:underline"
                  >
                    {showDriftOnly ? "Tất cả" : "Chỉ lệch"}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={toggleAllVisible}
                  className="text-warm-600 hover:underline"
                >
                  {allVisibleSelected ? "Bỏ chọn" : "Chọn hết"}
                </button>
              </span>
            </div>

            <div className="max-h-[min(360px,50vh)] space-y-1.5 overflow-y-auto">
              {visibleRows.map((row) => (
                <RecalculateSourceRow
                  key={row.sourceId}
                  row={row}
                  checked={selected.has(row.sourceId)}
                  onToggle={() => toggle(row.sourceId)}
                />
              ))}
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 border-t border-warm-100 pt-3">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="button"
            size="sm"
            isLoading={applyM.isPending}
            disabled={selected.size === 0 || previewQ.isLoading}
            onClick={() => void handleApply()}
          >
            Áp dụng{selected.size > 0 ? ` (${String(selected.size)})` : ""}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
