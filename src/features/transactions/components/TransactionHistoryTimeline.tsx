"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import * as React from "react";

import { formatRelativeTime } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/components/ui/Skeleton";

import type { FinTransactionHistory, HistoryChangeType } from "../types";
import { computeHistoryRowFieldDiff } from "../utils/historyFieldDiff";

import { useTransactionHistory } from "../hooks/useTransactionHistory";

function changeTypeLabel(t: HistoryChangeType): string {
  const m: Record<HistoryChangeType, string> = {
    created: "Tạo mới",
    updated: "Cập nhật",
    deleted: "Đã xóa",
    restored: "Khôi phục",
    cancelled: "Huỷ",
  };
  return m[t] ?? t;
}

function changeTypeBadgeClass(t: HistoryChangeType): string {
  const m: Record<HistoryChangeType, string> = {
    created: "border-emerald-200 bg-emerald-50 text-emerald-900",
    updated: "border-sky-200 bg-sky-50 text-sky-900",
    deleted: "border-danger/40 bg-danger/10 text-danger",
    restored: "border-violet-200 bg-violet-50 text-violet-900",
    cancelled: "border-warm-300 bg-warm-100 text-warm-800",
  };
  return m[t] ?? "border-warm-200 bg-warm-50 text-warm-800";
}

function formatActor(changedBy: string | null | undefined): string {
  const s = changedBy?.trim();
  if (!s) return "—";
  return s.length > 36 ? `${s.slice(0, 8)}…` : s;
}

export interface TransactionHistoryTimelineProps {
  transactionId: string | null | undefined;
  enabled?: boolean;
}

function HistoryTimelineSkeleton() {
  return (
    <div className="relative space-y-5 border-l border-warm-200 pl-6" aria-busy aria-label="Đang tải lịch sử">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="relative">
          <span className="absolute -left-[25px] top-2 size-2.5 rounded-full bg-warm-200 ring-4 ring-surface" />
          <Skeleton className="mb-2 h-4 w-[55%]" />
          <Skeleton className="h-3 w-[40%]" />
        </div>
      ))}
    </div>
  );
}

export function TransactionHistoryTimeline({
  transactionId,
  enabled = true,
}: TransactionHistoryTimelineProps) {
  const q = useTransactionHistory(transactionId, { enabled });
  const [openId, setOpenId] = React.useState<string | null>(null);

  if (q.isPending) return <HistoryTimelineSkeleton />;

  if (q.isError) {
    return (
      <p className="text-sm text-danger">
        Không tải được lịch sử. Thử lại sau hoặc chuyển tab rồi quay lại.
      </p>
    );
  }

  const rows = q.data ?? [];

  if (rows.length === 0) {
    return (
      <p className="text-sm text-warm-500">Chưa có lịch sử.</p>
    );
  }

  function diffForRow(
    h: FinTransactionHistory,
    index: number,
  ): { field: string; oldDisplay: string; newDisplay: string }[] {
    const prevSnap = index > 0 ? rows[index - 1]?.snapshot : null;
    return computeHistoryRowFieldDiff({
      previousSnapshotJson: prevSnap ?? null,
      currentSnapshotJson: h.snapshot ?? null,
      changedFieldsJson: h.changedFields ?? null,
      changeType: h.changeType,
    });
  }

  return (
    <ol className="relative m-0 list-none space-y-2 border-l border-warm-200 pl-6">
      {rows.map((h, index) => {
        const diffRows = diffForRow(h, index);
        const expandable = diffRows.length > 0;
        const isOpen = openId === h.id;

        return (
          <li key={h.id} className="relative py-2 pl-1">
            <span
              className="absolute -left-[25px] top-6 size-2.5 rounded-full bg-accent ring-4 ring-surface"
              aria-hidden
            />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="font-mono text-sm font-semibold text-warm-900">
                v{h.version}
              </span>
              <span
                className={cn(
                  "rounded-md border px-2 py-0.5 text-xs font-medium",
                  changeTypeBadgeClass(h.changeType),
                )}
              >
                {changeTypeLabel(h.changeType)}
              </span>
            </div>
            <p className="mt-1 text-xs text-warm-600">
              <span className="font-medium text-warm-700">{formatActor(h.changedBy)}</span>
              {" · "}
              <span title={h.createdAt}>{formatRelativeTime(h.createdAt)}</span>
            </p>
            {h.changeReason ? (
              <p className="mt-2 text-xs text-warm-600">
                <span className="text-warm-500">Lý do:</span> {h.changeReason}
              </p>
            ) : null}

            {expandable ? (
              <button
                type="button"
                className={cn(
                  "mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-dark",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                )}
                onClick={() =>
                  setOpenId((prev) => (prev === h.id ? null : h.id))
                }
              >
                {isOpen ? (
                  <ChevronDown className="size-3.5" aria-hidden />
                ) : (
                  <ChevronRight className="size-3.5" aria-hidden />
                )}
                {isOpen ? "Thu gọn thay đổi" : "Chi tiết thay đổi"}
              </button>
            ) : null}

            {expandable && isOpen ? (
              <div className="mt-3 overflow-x-auto rounded-lg border border-warm-100 bg-warm-25">
                <table className="w-full min-w-[280px] border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-warm-100 bg-warm-50">
                      <th className="px-3 py-2 text-left font-semibold text-warm-700">
                        Trường
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-warm-700">
                        Giá trị (cũ → mới)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-warm-800">
                    {diffRows.map((r) => (
                      <tr
                        key={r.field}
                        className="border-b border-warm-100 last:border-b-0"
                      >
                        <td className="align-top px-3 py-2 font-mono text-[11px] text-warm-600">
                          {r.field}
                        </td>
                        <td className="px-3 py-2">
                          <span className="whitespace-pre-wrap break-all text-danger line-through decoration-warm-400 decoration-1">
                            {r.oldDisplay}
                          </span>
                          {" → "}
                          <span className="whitespace-pre-wrap break-all text-success">
                            {r.newDisplay}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
