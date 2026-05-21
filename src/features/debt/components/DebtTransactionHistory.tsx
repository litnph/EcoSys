"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

import { formatCurrency, formatDate } from "@/shared/lib/formatters";
import { listStaggerItemMotion, listStaggerMotion } from "@/shared/lib/animations";
import { cn } from "@/shared/lib/utils";

import type { DebtTransaction, DebtTxnType } from "../types";

function typeLabel(t: DebtTxnType): string {
  switch (t) {
    case "payment":
      return "Trả nợ";
    case "collection":
      return "Thu hồi";
    default:
      return t;
  }
}

export interface DebtTransactionHistoryProps {
  transactions: DebtTransaction[];
  currency: string;
  className?: string;
}

export function DebtTransactionHistory({
  transactions,
  currency,
  className,
}: DebtTransactionHistoryProps) {
  const sorted = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const d = a.txnDate.localeCompare(b.txnDate);
      if (d !== 0) return d;
      return a.createdAt.localeCompare(b.createdAt);
    });
  }, [transactions]);

  if (sorted.length === 0) {
    return (
      <p className={cn("text-sm text-warm-600", className)}>
        Chưa có biến động thanh toán nào (khoản mới tạo có thể chỉ có giao dịch
        gốc trong danh sách giao dịch).
      </p>
    );
  }

  return (
    <motion.ul
      {...listStaggerMotion}
      className={cn("flex flex-col gap-2", className)}
    >
      {sorted.map((tx) => (
        <motion.li
          key={tx.id}
          {...listStaggerItemMotion}
          className="flex flex-wrap items-baseline justify-between gap-2 rounded-md bg-surface px-3 py-2 text-sm shadow-sm ring-1 ring-warm-100"
        >
          <div className="min-w-0">
            <span className="font-medium text-warm-900">
              {formatDate(tx.txnDate)}
            </span>
            {tx.note ? (
              <span className="mt-0.5 block truncate text-warm-600">{tx.note}</span>
            ) : null}
            <span className="mt-1 block text-xs text-warm-500">
              {typeLabel(tx.type)}
            </span>
          </div>
          <span className="shrink-0 font-mono font-semibold tabular-nums text-warm-900">
            {formatCurrency(tx.amount, currency)}
          </span>
        </motion.li>
      ))}
    </motion.ul>
  );
}
