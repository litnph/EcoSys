import { Tag } from "lucide-react";
import { Link } from "@/i18n/navigation";

import { ROUTES } from "@/config/routes";
import { SkeletonText } from "@/shared/components/ui/Skeleton";
import { formatCurrency, formatDate } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";

import type { Transaction } from "../types";
import { categoryGlyph } from "../utils/categoryGlyph";
import { isIncomeTxnType } from "../utils/financeDisplay";

type RecentTransactionsProps = {
  items: Transaction[] | undefined;
  isLoading: boolean;
};

export function RecentTransactions({
  items,
  isLoading,
}: RecentTransactionsProps) {
  if (isLoading || items === undefined) {
    return (
      <article className="flex h-full flex-col rounded-lg border border-warm-200 bg-surface p-5 shadow-sm">
        <SkeletonText className="mb-4 h-5 w-40" />
        {Array.from({ length: 5 }, (_, i) => (
          <SkeletonText key={i} className="mb-3 h-12 w-full rounded-lg" />
        ))}
      </article>
    );
  }

  const rows = items.slice(0, 5);

  return (
    <article className="flex h-full flex-col rounded-lg border border-warm-200 bg-surface p-5 shadow-sm">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="font-display text-base font-semibold text-warm-900">
            Giao dịch gần đây
          </h3>
          <p className="mt-1 text-sm text-warm-500">5 giao dịch mới nhất</p>
        </div>
        <Link
          href={ROUTES.dashboard.transactions}
          className="text-sm font-medium text-accent transition hover:text-accent-dark"
        >
          Xem tất cả
        </Link>
      </header>

      {rows.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-sm text-warm-400">
          Chưa có giao dịch
        </p>
      ) : (
        <ul className="flex flex-1 flex-col divide-y divide-warm-100">
          {rows.map((tx) => {
            const label =
              typeof tx.categoryName === "string" &&
              tx.categoryName.length > 0
                ? tx.categoryName
                : tx.description;
            const emoji = categoryGlyph(tx.categoryName ?? tx.description);
            const income = isIncomeTxnType(tx.type);

            return (
              <li
                key={tx.id}
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
                    <span className="truncate">{label}</span>
                  </p>
                  <p className="text-xs text-warm-500">
                    {formatDate(tx.txnDate)}
                  </p>
                </div>
                <p
                  className={cn(
                    "shrink-0 font-mono text-sm font-semibold tabular-nums",
                    income ? "text-success" : "text-warm-900",
                  )}
                >
                  {income ? "+" : "−"}
                  {formatCurrency(tx.amount)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
