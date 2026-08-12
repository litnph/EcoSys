import { formatCurrency, formatDate } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";
import { DataTableScrollRegion } from "@/shared/components/ui/DataTableScrollRegion";

import type { SourceBalanceLedgerEntry } from "../types/balanceLedger";

function entryTypeLabel(type: string | null, kind: string): string {
  if (kind === "opening") return "Số dư ban đầu";
  switch (type) {
    case "balance_adjustment":
      return "Điều chỉnh";
    case "income":
      return "Thu nhập";
    case "direct":
      return "Chi trực tiếp";
    case "transfer":
      return "Chuyển khoản";
    case "split":
      return "Chia bill";
    default:
      return type ?? "Giao dịch";
  }
}

export interface SourceBalanceLedgerTableProps {
  entries: SourceBalanceLedgerEntry[];
  currency: string;
}

export function SourceBalanceLedgerTable({
  entries,
  currency,
}: SourceBalanceLedgerTableProps) {
  if (entries.length === 0) {
    return (
      <p className="rounded-card border border-warm-200 bg-warm-25/60 px-4 py-8 text-center text-sm text-warm-500">
        Chưa có biến động nào trên sổ số dư.
      </p>
    );
  }

  return (
    <DataTableScrollRegion
      label="Sổ biến động số dư"
      className="rounded-card border border-warm-200"
    >
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">Sổ biến động số dư</caption>
        <thead className="border-b border-warm-200 bg-warm-50 text-warm-600">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">Ngày</th>
            <th scope="col" className="px-3 py-2 font-medium">Loại</th>
            <th scope="col" className="px-3 py-2 font-medium">Mô tả</th>
            <th scope="col" className="px-3 py-2 text-right font-medium">Biến động</th>
            <th scope="col" className="px-3 py-2 text-right font-medium">Số dư sau</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((row, idx) => (
            <tr
              key={
                row.transactionId ??
                `opening-${String(idx)}`
              }
              className="border-b border-warm-100 last:border-0"
            >
              <td className="whitespace-nowrap px-3 py-2 tabular-nums text-warm-700">
                {formatDate(row.txnDate)}
              </td>
              <td className="px-3 py-2 text-warm-600">
                {entryTypeLabel(row.transactionType, row.entryKind)}
              </td>
              <td className="max-w-[240px] truncate px-3 py-2 text-warm-800">
                {row.description}
              </td>
              <td
                className={cn(
                  "px-3 py-2 text-right font-mono font-semibold tabular-nums",
                  row.delta > 0
                    ? "text-success"
                    : row.delta < 0
                      ? "text-danger"
                      : "text-warm-500")}
              >
                {row.delta > 0 ? "+" : ""}
                {formatCurrency(row.delta, currency)}
              </td>
              <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums text-warm-900">
                {formatCurrency(row.balanceAfter, currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DataTableScrollRegion>
  );
}
