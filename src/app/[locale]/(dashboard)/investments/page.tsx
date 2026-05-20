"use client";

import { Trash2 } from "lucide-react";

import { useDeleteInvestment, useInvestments } from "@/features/investments";
import { PageHeader } from "@/shared/components/layouts/PageHeader";
import { formatCurrency } from "@/shared/lib/formatters";

export default function InvestmentsPage() {
  const { data: items, isLoading, isError } = useInvestments();
  const del = useDeleteInvestment();
  return (
    <div className="w-full max-w-4xl">
      <PageHeader
        title="Đầu tư"
        description="Danh sách khoản đầu tư trong module tài chính."
      />
      {isError ? (
        <p className="mt-8 text-sm text-danger">Không tải được danh sách.</p>
      ) : isLoading ? (
        <p className="mt-8 text-sm text-warm-500">Đang tải…</p>
      ) : (
        <ul className="mt-8 space-y-2">
          {(items ?? []).map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between rounded-card border border-warm-200 bg-surface px-4 py-3 shadow-sm"
            >
              <div>
                <p className="font-medium text-warm-900">{row.name}</p>
                <p className="text-xs text-warm-500">{row.type}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-semibold">
                  {formatCurrency(row.currentValue, row.currency)}
                </span>
                <button
                  type="button"
                  className="rounded p-2 text-warm-500 hover:text-danger"
                  aria-label="Xóa"
                  onClick={() => del.mutate(row.id)}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
