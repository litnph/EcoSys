import { Check } from "lucide-react";
import { motion } from "framer-motion";

import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { cn } from "@/shared/lib/utils";
import { formatCurrency, formatDate } from "@/shared/lib/formatters";
import { listStaggerItemMotion, listStaggerMotion } from "@/shared/lib/animations";

import type { InstallmentPay, InstallmentPayLineStatus } from "../types";

function payStatusLabel(s: InstallmentPayLineStatus): string {
  switch (s) {
    case "upcoming":
      return "Sắp tới";
    case "due":
      return "Đến hạn";
    case "paid":
      return "Đã trả";
    case "overdue":
      return "Quá hạn";
    default:
      return s;
  }
}

function payStatusBadgeClasses(s: InstallmentPayLineStatus): string {
  switch (s) {
    case "due":
      return "bg-accent/15 text-accent ring-1 ring-accent/25";
    case "paid":
      return "bg-success/15 text-success ring-1 ring-success/20";
    case "overdue":
      return "bg-danger/15 text-danger ring-1 ring-danger/25";
    default:
      return "bg-warm-100 text-warm-600 ring-1 ring-warm-200";
  }
}

export interface InstallmentPaysTimelineProps {
  pays: InstallmentPay[];
  currency: string;
  onPay?: (pay: InstallmentPay) => void;
}

export function InstallmentPaysTimeline({
  pays,
  currency,
  onPay,
}: InstallmentPaysTimelineProps) {
  const sorted = [...pays].sort((a, b) => a.installmentNumber - b.installmentNumber);

  return (
    <div className="relative pl-6">
      <div
        className="pointer-events-none absolute left-[7px] top-2 bottom-2 w-px bg-warm-200"
        aria-hidden
      />
      <motion.ul
        {...listStaggerMotion}
        className="flex flex-col gap-4"
      >
        {sorted.map((pay) => {
          const remaining = Math.max(0, pay.amount - pay.paidAmount);
          const canPay =
            pay.canPayDirectly && remaining > 0 && typeof onPay === "function";

          return (
            <motion.li key={pay.id} {...listStaggerItemMotion} className="relative">
              <div
                className={cn(
                  "absolute -left-6 top-3 size-3 rounded-full border-2 bg-surface",
                  pay.status === "paid"
                    ? "border-success bg-success"
                    : pay.status === "overdue"
                      ? "border-danger bg-danger"
                      : pay.status === "due"
                        ? "border-accent bg-accent"
                        : "border-warm-300")}
              />
              <div
                className={cn(
                  "rounded-card border bg-surface p-4 shadow-sm",
                  pay.status === "due" &&
                    "border-accent ring-2 ring-accent/20",
                  pay.status === "overdue" && "border-danger/50 bg-danger/[0.03]")}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="font-display text-sm font-semibold text-warm-900">
                      Kỳ {String(pay.installmentNumber)}
                    </p>
                    <p className="text-xs text-warm-500">
                      Lên sao kê{" "}
                      <span className="font-medium text-warm-800 tabular-nums">
                        {formatDate(pay.statementDate)}
                      </span>
                      {" · "}Hạn thanh toán{" "}
                      <span className="font-medium text-warm-800 tabular-nums">
                        {formatDate(pay.dueDate)}
                      </span>
                    </p>
                  </div>
                  <Badge
                    size="sm"
                    className={cn(
                      "capitalize",
                      payStatusBadgeClasses(pay.status))}
                  >
                    {payStatusLabel(pay.status)}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs text-warm-500">Số tiền kỳ</p>
                    <p className="font-mono text-sm font-semibold tabular-nums text-warm-900">
                      {formatCurrency(pay.amount, currency)}
                    </p>
                    {pay.status === "paid" && pay.paidAt ? (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-success">
                        <Check className="size-3.5 shrink-0" aria-hidden />
                        Đã trả · {formatDate(pay.paidAt)}
                      </p>
                    ) : null}
                  </div>
                  {canPay ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => onPay?.(pay)}
                    >
                      Thanh toán
                    </Button>
                  ) : null}
                </div>
              </div>
            </motion.li>
          );
        })}
      </motion.ul>
    </div>
  );
}
