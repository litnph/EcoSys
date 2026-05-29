import { Tag } from "lucide-react";
import { motion } from "framer-motion";

import { SkeletonText } from "@/shared/components/ui/Skeleton";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/config/routes";
import { formatCurrency, formatDate } from "@/shared/lib/formatters";
import {
  cardSlideUpMotion,
  listStaggerItemMotion,
  listStaggerMotion,
} from "@/shared/lib/animations";
import { cn } from "@/shared/lib/utils";

import type { Transaction } from "../types";
import { isIncomeTxnType } from "../utils/financeDisplay";

type RecentTransactionsCardProps = {
  items: Transaction[] | undefined;
  isLoading: boolean;
};

/** Small emoji heuristic from category/description for dashboard list flair. */
function categoryGlyph(label: string | undefined): string {
  if (!label || label.trim().length === 0) return "💰";
  const mod = label
    .toLowerCase()
    .split("")
    .reduce((a, ch) => a + ch.codePointAt(0)!, 0);
  const emojis = [
    "🍜",
    "🚗",
    "🏠",
    "☕",
    "📱",
    "🎯",
    "🎁",
    "✈️",
    "📚",
    "🎮",
    "🛒",
    "💡",
    "🐾",
    "🎵",
  ];
  return emojis[mod % emojis.length]!;
}

export function RecentTransactionsCard({
  items,
  isLoading,
}: RecentTransactionsCardProps) {
  if (isLoading || items === undefined) {
    return (
      <motion.article
        {...cardSlideUpMotion}
        className="rounded-card border border-warm-200 bg-surface p-5 shadow-sm"
      >
        <div className="mb-4 flex justify-between gap-4">
          <SkeletonText className="h-5 w-44" />
          <SkeletonText className="h-4 w-20" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <SkeletonText key={i} className="h-10 w-full rounded-input" />
          ))}
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      {...cardSlideUpMotion}
      className="rounded-card border border-warm-200 bg-surface p-5 shadow-sm"
    >
      <header className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h3 className="font-display text-base font-semibold text-warm-900">
          Giao dịch gần đây
        </h3>
        <Link
          href={ROUTES.dashboard.transactions}
          className="text-sm font-medium text-accent transition hover:text-accent-dark"
        >
          Xem tất cả
        </Link>
      </header>
      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-warm-400">
          Chưa có giao dịch
        </p>
      ) : (
        <motion.ul
          {...listStaggerMotion}
          className="flex flex-col divide-y divide-warm-100"
        >
          {items.slice(0, 5).map((tx) => {
            const label =
              typeof tx.categoryName === "string" && tx.categoryName.length > 0
                ? tx.categoryName
                : tx.description;
            const emoji = categoryGlyph(tx.categoryName ?? tx.description);
            const income = isIncomeTxnType(tx.type);

            return (
              <motion.li
                key={tx.id}
                {...listStaggerItemMotion}
                className="flex items-center gap-3 py-3 first:pt-0"
              >
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warm-50 text-lg ring-1 ring-warm-200"
                  aria-hidden
                >
                  {emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 truncate font-medium text-warm-900">
                    <Tag className="size-3 shrink-0 text-warm-300" aria-hidden />
                    <span className="truncate">{label}</span>
                  </p>
                  <p className="truncate text-xs text-warm-400">
                    {formatDate(tx.txnDate)}
                  </p>
                </div>
                <p
                  className={cn(
                    "shrink-0 font-mono text-sm font-semibold tabular-nums",
                    income ? "text-success" : "text-danger")}
                >
                  {income ? "+" : "−"}
                  {formatCurrency(tx.amount)}
                </p>
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </motion.article>
  );
}
