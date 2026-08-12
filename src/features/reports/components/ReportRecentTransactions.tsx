import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Tag } from "lucide-react";
import { useMemo } from "react";
import { Link } from "@/i18n/navigation";

import { ROUTES } from "@/config/routes";
import { categoryGlyph } from "@/features/dashboard/utils/categoryGlyph";
import { SkeletonText } from "@/shared/components/ui/Skeleton";
import { formatCurrency } from "@/shared/lib/formatters";

import type { MonthlyReport } from "../types";
import { extractReportRecentTransactions } from "../utils/extractReportRecentTransactions";

type ReportRecentTransactionsProps = {
  report: MonthlyReport | undefined;
  isLoading: boolean;
  year: number;
  month: number;
};

export function ReportRecentTransactions({
  report,
  isLoading,
  year,
  month,
}: ReportRecentTransactionsProps) {
  const rows = useMemo(
    () => (report ? extractReportRecentTransactions(report) : []),
    [report],
  );

  if (isLoading || report === undefined) {
    return (
      <article className="flex h-full flex-col rounded-lg border border-warm-200 bg-surface p-5 shadow-sm">
        <SkeletonText className="mb-4 h-5 w-40" />
        {Array.from({ length: 5 }, (_, i) => (
          <SkeletonText key={i} className="mb-3 h-12 w-full rounded-lg" />
        ))}
      </article>
    );
  }

  const qs = new URLSearchParams({
    year: String(year),
    month: String(month),
  });

  return (
    <article className="flex h-full flex-col rounded-lg border border-warm-200 bg-surface p-5 shadow-sm">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="font-display text-base font-semibold text-warm-900">
            Giao dịch gần đây
          </h3>
          <p className="mt-1 text-sm text-warm-500">
            Trong tháng báo cáo
          </p>
        </div>
        <Link
          href={`${ROUTES.dashboard.transactions}?${qs.toString()}`}
          className="text-sm font-medium text-accent transition hover:text-accent-dark"
        >
          Xem tất cả
        </Link>
      </header>

      {rows.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-sm text-warm-400">
          Không có giao dịch chi trong tháng
        </p>
      ) : (
        <ul className="flex flex-1 flex-col divide-y divide-warm-100">
          {rows.map((txn) => {
            const emoji = categoryGlyph(txn.category);
            return (
              <li
                key={txn.id}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-warm-50 text-base ring-1 ring-warm-200"
                  aria-hidden
                >
                  {emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 truncate text-sm font-medium text-warm-900">
                    <Tag className="size-3 shrink-0 text-warm-300" aria-hidden />
                    <span className="truncate">{txn.title}</span>
                  </p>
                  <p className="text-xs text-warm-500">
                    {txn.category} ·{" "}
                    {format(new Date(`${txn.date}T00:00:00`), "d MMM", {
                      locale: vi,
                    })}
                  </p>
                </div>
                <p className="shrink-0 font-mono text-sm font-semibold tabular-nums text-warm-900">
                  −{formatCurrency(txn.amount, report?.metadata?.currency ?? "VND")}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
