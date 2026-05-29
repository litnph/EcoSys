import { AlertTriangle } from "lucide-react";
import * as React from "react";

import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";
import { cn } from "@/shared/lib/utils";
import { formatCurrency } from "@/shared/lib/formatters";

import {
  useApplySourcesRecalculate,
  useSourcesRecalculatePreview,
} from "../hooks/useSourcesRecalculate";
import type { SourceRecalculatePreviewItem } from "../types/recalculate";
import { sourceTypeLabelVi } from "../utils/sourceLabels";

function formatUtil(pct: number | null): string {
  if (pct === null) return "—";
  return `${String(pct)}%`;
}

function formatDrift(drift: number, currency: string): string {
  if (drift === 0) return "—";
  const sign = drift > 0 ? "+" : "";
  return `${sign}${formatCurrency(drift, currency)}`;
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
  const initialized = React.useRef(false);

  React.useEffect(() => {
    if (!isOpen) {
      initialized.current = false;
      setSelected(new Set());
      return;
    }
    if (previewQ.data && !initialized.current) {
      initialized.current = true;
      const withDrift = previewQ.data
        .filter((row) => row.drift !== 0)
        .map((row) => row.sourceId);
      setSelected(new Set(withDrift));
    }
  }, [isOpen, previewQ.data]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (rows: SourceRecalculatePreviewItem[]) => {
    setSelected((prev) => {
      if (prev.size === rows.length) return new Set();
      return new Set(rows.map((r) => r.sourceId));
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

  const rows = previewQ.data ?? [];
  const allSelected = rows.length > 0 && selected.size === rows.length;
  const hasDrift = rows.some((r) => r.drift !== 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="reCal — đối chiếu số dư & hạn mức"
      description="Tính lại số dư từ giao dịch. Hạn mức thẻ giữ nguyên; % sử dụng được tính từ balance ÷ credit limit."
      size="xl"
    >
      <div className="flex flex-col gap-4">
        {hasDrift ? (
          <div
            className="flex gap-2 rounded-button border border-warning/35 bg-warning/10 px-3 py-2 text-sm text-warm-800"
            role="alert"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
            <p>
              Có nguồn lệch số dư. Chọn nguồn cần áp dụng rồi bấm「Xác nhận áp dụng」.
            </p>
          </div>
        ) : null}

        {previewQ.isLoading ? (
          <p className="py-8 text-center text-sm text-warm-500">Đang tính toán…</p>
        ) : previewQ.isError ? (
          <p className="py-8 text-center text-sm text-danger">
            Không tải được bản xem trước reCal.
          </p>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-warm-500">Chưa có nguồn tài chính.</p>
        ) : (
          <div className="max-h-[min(420px,55vh)] overflow-auto rounded-lg border border-warm-200">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-warm-50/95 backdrop-blur-sm">
                <tr className="border-b border-warm-200 text-left text-xs font-semibold uppercase tracking-wide text-warm-500">
                  <th className="px-3 py-2 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      aria-label="Chọn tất cả"
                      onChange={() => toggleAll(rows)}
                    />
                  </th>
                  <th className="px-3 py-2">Nguồn</th>
                  <th className="px-3 py-2 text-right">Đang lưu</th>
                  <th className="px-3 py-2 text-right">Tính lại</th>
                  <th className="px-3 py-2 text-right">Lệch</th>
                  <th className="px-3 py-2 text-right">Hạn mức</th>
                  <th className="px-3 py-2 text-right">% dùng (cũ→mới)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {rows.map((row) => {
                  const checked = selected.has(row.sourceId);
                  const driftTone =
                    row.drift === 0
                      ? "text-warm-500"
                      : row.drift > 0
                        ? "text-warning"
                        : "text-accent";

                  return (
                    <tr
                      key={row.sourceId}
                      className={cn(
                        "bg-surface",
                        row.drift !== 0 && "bg-warning/[0.03]")}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          aria-label={`Chọn ${row.name}`}
                          onChange={() => toggle(row.sourceId)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-warm-900">{row.name}</p>
                        <p className="text-xs text-warm-500">
                          {sourceTypeLabelVi(row.type)}
                        </p>
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">
                        {formatCurrency(row.storedBalance, row.currency)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums font-semibold">
                        {formatCurrency(row.computedBalance, row.currency)}
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2 text-right font-mono tabular-nums font-semibold",
                          driftTone)}
                      >
                        {formatDrift(row.drift, row.currency)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-warm-600">
                        {row.creditLimit != null && row.creditLimit > 0
                          ? formatCurrency(row.creditLimit, row.currency)
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-xs text-warm-700">
                        {row.creditLimit != null && row.creditLimit > 0 ? (
                          <>
                            {formatUtil(row.storedUtilizationPercent)}
                            {" → "}
                            <span className="font-semibold text-warm-900">
                              {formatUtil(row.computedUtilizationPercent)}
                            </span>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-warm-100 pt-3">
          <p className="text-xs text-warm-500">
            Đã chọn {String(selected.size)}/{String(rows.length)} nguồn
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="button"
              isLoading={applyM.isPending}
              disabled={selected.size === 0 || previewQ.isLoading}
              onClick={() => void handleApply()}
            >
              Xác nhận áp dụng
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
