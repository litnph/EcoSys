"use client";

import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";
import { CalendarClock } from "lucide-react";
import { motion } from "framer-motion";

import { Badge } from "@/shared/components/ui/Badge";
import {
  SkeletonText,
  SkeletonAvatar,
} from "@/shared/components/ui/Skeleton";
import { formatCurrency, formatDate } from "@/shared/lib/formatters";
import { slideUp, staggerChildren, staggerItem } from "@/shared/lib/animations";

import type { BillingCycleDue, InstallmentPayDue } from "../types";

type UpcomingDuesCardProps = {
  billingCycles: BillingCycleDue[] | undefined;
  installments: InstallmentPayDue[] | undefined;
  isLoading: boolean;
};

type CombinedDue =
  | { kind: "cycle"; cycle: BillingCycleDue }
  | { kind: "pay"; pay: InstallmentPayDue };

function parseDayOnly(isoDate: string): Date {
  return parseISO(`${isoDate}T00:00:00`);
}

/** Days late when due date strictly before today's calendar day (local). */
function overdueDays(isoDue: string): number {
  const due = parseDayOnly(isoDue);
  const today = startOfDay(new Date());
  const diff = differenceInCalendarDays(today, due);
  return diff > 0 ? diff : 0;
}

export function UpcomingDuesCard({
  billingCycles,
  installments,
  isLoading,
}: UpcomingDuesCardProps) {
  if (
    isLoading ||
    billingCycles === undefined ||
    installments === undefined
  ) {
    return (
      <motion.article
        variants={slideUp}
        className="flex flex-col gap-4 rounded-card border border-warm-200 bg-surface p-5 shadow-sm"
      >
        <SkeletonText className="h-6 w-[55%]" />
        {[0, 1].map((i) => (
          <div key={i} className="flex gap-3">
            <SkeletonAvatar />
            <div className="flex-1 space-y-2">
              <SkeletonText className="h-4" />
              <SkeletonText className="h-3 w-24" />
            </div>
          </div>
        ))}
      </motion.article>
    );
  }

  const combined: CombinedDue[] = [
    ...billingCycles.map((cycle) => ({ kind: "cycle" as const, cycle })),
    ...installments.map((pay) => ({ kind: "pay" as const, pay })),
  ].sort((a, b) => {
    const da =
      a.kind === "cycle" ? a.cycle.paymentDueDate : a.pay.dueDate;
    const db =
      b.kind === "cycle" ? b.cycle.paymentDueDate : b.pay.dueDate;
    return da.localeCompare(db);
  });

  return (
    <motion.article
      variants={slideUp}
      className="flex flex-col gap-4 rounded-card border border-warm-200 bg-surface p-5 shadow-sm"
    >
      <h3 className="flex items-center gap-2 font-display text-base font-semibold text-warm-900">
        <CalendarClock className="size-5 text-accent" aria-hidden />
        Sắp đến hạn
      </h3>
      {combined.length === 0 ? (
        <p className="py-8 text-center text-sm text-warm-400">
          Không có khoản sắp đến hạn
        </p>
      ) : (
        <motion.ul
          variants={staggerChildren}
          initial="initial"
          animate="animate"
          className="flex max-h-80 flex-col gap-3 overflow-y-auto pe-1"
        >
          {combined.map((row, idx) => {
            if (row.kind === "cycle") {
              const c = row.cycle;
              const late = overdueDays(c.paymentDueDate);
              return (
                <motion.li
                  key={`bc-${c.id}`}
                  variants={staggerItem}
                  className={
                    late > 0
                      ? "rounded-lg border border-danger/40 bg-danger/5 px-3 py-2"
                      : "rounded-lg border border-warm-100 bg-warm-25 px-3 py-2"
                  }
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-medium text-warm-900">
                      Sao kê thẻ · {c.sourceName}
                    </p>
                    {late > 0 ? (
                      <Badge variant="danger" size="sm">
                        Quá hạn {String(late)} ngày
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 font-mono text-sm text-danger">
                    {formatCurrency(c.amountDue)}
                  </p>
                  <p className="text-xs text-warm-400">
                    Hạn: {formatDate(c.paymentDueDate)}
                  </p>
                </motion.li>
              );
            }

            const p = row.pay;
            const late = overdueDays(p.dueDate);

            return (
              <motion.li
                key={`ip-${p.planId}-${String(p.installmentNumber)}-${String(idx)}`}
                variants={staggerItem}
                className={
                  late > 0
                    ? "rounded-lg border border-danger/40 bg-danger/5 px-3 py-2"
                    : "rounded-lg border border-warm-100 bg-warm-25 px-3 py-2"
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-medium text-warm-900">
                    Trả góp · #{String(p.installmentNumber)} ·{" "}
                    {p.planDescription}
                  </p>
                  {late > 0 ? (
                    <Badge variant="danger" size="sm">
                      Quá hạn {String(late)} ngày
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 font-mono text-sm text-danger">
                  {formatCurrency(p.remainingAmount)}
                </p>
                <p className="text-xs text-warm-400">
                  Hạn: {formatDate(p.dueDate)}
                </p>
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </motion.article>
  );
}
