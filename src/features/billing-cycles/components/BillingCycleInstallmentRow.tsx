import { formatCurrency, formatDate } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";

import type { BillingCycleInstallmentDue, InstallmentPayLineStatus } from "../types";

function payStatusLabel(status: InstallmentPayLineStatus): string {
  switch (status) {
    case "due":
      return "Đến hạn";
    case "paid":
      return "Đã trả";
    case "overdue":
      return "Quá hạn";
    default:
      return "Sắp tới";
  }
}

function payStatusBadgeClasses(status: InstallmentPayLineStatus): string {
  switch (status) {
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

export interface BillingCycleInstallmentRowProps {
  due: BillingCycleInstallmentDue;
  currency: string;
}

export function BillingCycleInstallmentRow({
  due,
  currency,
}: BillingCycleInstallmentRowProps) {
  const label =
    due.planDescription?.trim() ||
    due.categoryName?.trim() ||
    "Trả góp";

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-warm-200 bg-surface px-3 py-2.5">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="min-w-0 truncate text-sm font-semibold text-warm-900">
            {label}
          </p>
          <span className="shrink-0 rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-800">
            Trả góp
          </span>
          <span
            className={cn(
              "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium",
              payStatusBadgeClasses(due.status),
            )}
          >
            {payStatusLabel(due.status)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-warm-500">
          <span className="tabular-nums">
            Kỳ {due.installmentNumber}/{due.totalInstallments}
          </span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">Hạn {formatDate(due.dueDate)}</span>
          {due.categoryName?.trim() ? (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">{due.categoryName}</span>
            </>
          ) : null}
        </div>
      </div>

      <p className="font-mono text-sm font-semibold tabular-nums text-expense">
        {formatCurrency(due.amount, currency)}
      </p>
    </div>
  );
}
