import { Wallet } from "lucide-react";
import type { ReactNode } from "react";

import { formatCurrency, formatDate } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";

import type { MonthlyReportDirectExpenseSection } from "../types";

export interface DirectExpensesSectionProps {
  section: MonthlyReportDirectExpenseSection | undefined;
  isLoading: boolean;
  className?: string;
}

function SectionShell({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-card border border-warm-200 bg-surface shadow-sm",
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-warm-100 px-4 py-3">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Wallet className="size-4" aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-sm font-semibold text-warm-900">{title}</h2>
            <p className="mt-0.5 text-xs text-warm-500">{subtitle}</p>
          </div>
        </div>
      </header>
      {children}
    </section>
  );
}

export function DirectExpensesSection({
  section,
  isLoading,
  className,
}: DirectExpensesSectionProps) {
  if (isLoading) {
    return (
      <SectionShell
        title="Chi trả trực tiếp"
        subtitle="Tiền mặt / ngân hàng — không gồm thanh toán kỳ sao kê."
        className={className}
      >
        <div className="space-y-2 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-md bg-warm-50" />
          ))}
        </div>
      </SectionShell>
    );
  }

  const items = section?.items ?? [];
  const total = section?.totalAmount ?? 0;
  const count = section?.transactionCount ?? items.length;

  return (
    <SectionShell
      title="Chi trả trực tiếp"
      subtitle="Tiền mặt / ngân hàng — không gồm thanh toán kỳ sao kê."
      className={className}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-warm-100 bg-warm-50/60 px-4 py-2.5 text-sm">
        <p className="text-warm-600">
          <span className="font-semibold tabular-nums text-warm-900">{count}</span> giao dịch
        </p>
        <p className="font-mono font-semibold tabular-nums text-danger">
          {formatCurrency(total)}
        </p>
      </div>

      {items.length === 0 ? (
        <p className="px-4 py-6 text-sm text-warm-500">
          Không có giao dịch chi trả trực tiếp trong tháng này.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-warm-100 text-left text-[10px] font-semibold uppercase tracking-wide text-warm-500">
                <th className="px-4 py-2">Ngày</th>
                <th className="px-4 py-2">Mô tả</th>
                <th className="px-4 py-2">Danh mục</th>
                <th className="px-4 py-2">Nguồn tiền</th>
                <th className="px-4 py-2 text-right">Số tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-warm-50/70">
                  <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-warm-700">
                    {formatDate(item.txnDate)}
                  </td>
                  <td className="max-w-[14rem] truncate px-4 py-2.5 font-medium text-warm-900">
                    {item.description}
                  </td>
                  <td className="px-4 py-2.5 text-warm-700">
                    {item.categoryName ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-warm-700">{item.sourceName}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono font-semibold tabular-nums text-warm-900">
                    −{formatCurrency(item.amount, item.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionShell>
  );
}
