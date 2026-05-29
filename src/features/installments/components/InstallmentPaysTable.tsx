import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { cn } from "@/shared/lib/utils";
import { formatCurrency, formatDate } from "@/shared/lib/formatters";

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

export interface InstallmentPaysTableProps {
  pays: InstallmentPay[];
  currency: string;
  onPay?: (pay: InstallmentPay) => void;
}

export function InstallmentPaysTable({
  pays,
  currency,
  onPay,
}: InstallmentPaysTableProps) {
  const sorted = [...pays].sort((a, b) => a.installmentNumber - b.installmentNumber);

  return (
    <div className="overflow-x-auto rounded-lg border border-warm-200">
      <table className="w-full min-w-[480px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-warm-200 bg-warm-50/80 text-left text-xs font-semibold uppercase tracking-wide text-warm-500">
            <th className="px-3 py-2">Kỳ</th>
            <th className="px-3 py-2">Hạn</th>
            <th className="px-3 py-2 text-right">Số tiền</th>
            <th className="px-3 py-2">Trạng thái</th>
            <th className="px-3 py-2 w-24" />
          </tr>
        </thead>
        <tbody className="divide-y divide-warm-100">
          {sorted.map((pay) => {
            const remaining = Math.max(0, pay.amount - pay.paidAmount);
            const canPay =
              (pay.status === "due" || pay.status === "overdue") &&
              remaining > 0 &&
              typeof onPay === "function";

            return (
              <tr
                key={pay.id}
                className={cn(
                  "bg-surface",
                  pay.status === "due" && "bg-accent/[0.04]",
                  pay.status === "overdue" && "bg-danger/[0.04]")}
              >
                <td className="px-3 py-2 font-medium tabular-nums text-warm-900">
                  {String(pay.installmentNumber)}
                </td>
                <td className="px-3 py-2 tabular-nums text-warm-700">
                  {formatDate(pay.dueDate)}
                </td>
                <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums text-warm-900">
                  {formatCurrency(pay.amount, currency)}
                </td>
                <td className="px-3 py-2">
                  <Badge
                    size="sm"
                    className={cn("capitalize", payStatusBadgeClasses(pay.status))}
                  >
                    {payStatusLabel(pay.status)}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-right">
                  {canPay ? (
                    <Button type="button" size="sm" variant="secondary" onClick={() => onPay?.(pay)}>
                      Trả
                    </Button>
                  ) : pay.status === "paid" && pay.paidAt ? (
                    <span className="text-xs text-warm-500 tabular-nums">
                      {formatDate(pay.paidAt)}
                    </span>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
