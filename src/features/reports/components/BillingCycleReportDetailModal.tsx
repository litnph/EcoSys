import { Modal } from "@/shared/components/ui/Modal";
import { formatCurrency, formatDate } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";

import type {
  MonthlyReportBillingCycleItem,
  MonthlyReportBillingCycleTxnItem,
  MonthlyReportBillingCycleInstallmentDue,
  MonthlyReportInstallmentPayStatus,
} from "../types";

function payStatusLabel(status: MonthlyReportInstallmentPayStatus): string {
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

function payStatusBadgeClasses(status: MonthlyReportInstallmentPayStatus): string {
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

function cycleDisplayName(cycle: MonthlyReportBillingCycleItem): string {
  const trimmed = cycle.name?.trim();
  if (trimmed) return trimmed;
  const month = new Date(`${cycle.statementDate}T12:00:00`).getMonth() + 1;
  return `Kỳ sao kê tháng ${String(month)}`;
}

function cyclePeriodLabel(cycle: MonthlyReportBillingCycleItem): string {
  return `${formatDate(cycle.periodStart)} — ${formatDate(cycle.periodEnd)}`;
}

function DeferredTxnTable({ txns }: { txns: MonthlyReportBillingCycleTxnItem[] }) {
  if (txns.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-warm-200 bg-warm-25/50 px-4 py-6 text-center text-sm text-warm-500">
        Chưa có giao dịch trả sau trong kỳ này.
      </p>
    );
  }

  return (
    <div className="max-h-[min(280px,40vh)] overflow-auto rounded-lg border border-warm-200">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 z-[1] bg-warm-50/95 backdrop-blur-sm">
          <tr className="border-b border-warm-100 text-left text-[10px] font-semibold uppercase tracking-wide text-warm-500">
            <th className="px-4 py-2">Ngày</th>
            <th className="px-4 py-2">Mô tả</th>
            <th className="px-4 py-2">Danh mục</th>
            <th className="px-4 py-2 text-right">Số tiền</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-warm-100">
          {txns.map((txn) => (
            <tr key={txn.id} className="hover:bg-warm-50/70">
              <td className="whitespace-nowrap px-4 py-2 tabular-nums text-warm-700">
                {formatDate(txn.txnDate)}
              </td>
              <td className="max-w-[14rem] truncate px-4 py-2 font-medium text-warm-900">
                {txn.description}
              </td>
              <td className="px-4 py-2 text-warm-700">
                {txn.categoryName ?? "—"}
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-right font-mono font-semibold tabular-nums text-warm-900">
                {formatCurrency(txn.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InstallmentDueTable({
  dues,
}: {
  dues: MonthlyReportBillingCycleInstallmentDue[];
}) {
  if (dues.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-warm-200 bg-warm-25/50 px-4 py-6 text-center text-sm text-warm-500">
        Không có kỳ trả góp đến hạn trong tháng sao kê này.
      </p>
    );
  }

  return (
    <div className="max-h-[min(280px,40vh)] overflow-auto rounded-lg border border-warm-200">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 z-[1] bg-warm-50/95 backdrop-blur-sm">
          <tr className="border-b border-warm-100 text-left text-[10px] font-semibold uppercase tracking-wide text-warm-500">
            <th className="px-4 py-2">Kỳ</th>
            <th className="px-4 py-2">Mô tả</th>
            <th className="px-4 py-2">Hạn</th>
            <th className="px-4 py-2">Trạng thái</th>
            <th className="px-4 py-2 text-right">Số tiền</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-warm-100">
          {dues.map((due) => (
            <tr key={due.payId} className="hover:bg-warm-50/70">
              <td className="whitespace-nowrap px-4 py-2 tabular-nums font-medium text-warm-900">
                {due.installmentNumber}/{due.totalInstallments}
              </td>
              <td className="max-w-[12rem] px-4 py-2">
                <p className="truncate font-medium text-warm-900">
                  {due.planDescription}
                </p>
                {due.categoryName ? (
                  <p className="truncate text-xs text-warm-500">{due.categoryName}</p>
                ) : null}
              </td>
              <td className="whitespace-nowrap px-4 py-2 tabular-nums text-warm-700">
                {formatDate(due.dueDate)}
              </td>
              <td className="px-4 py-2">
                <span
                  className={cn(
                    "inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                    payStatusBadgeClasses(due.status),
                  )}
                >
                  {payStatusLabel(due.status)}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-right font-mono font-semibold tabular-nums text-expense">
                {formatCurrency(due.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface BillingCycleReportDetailModalProps {
  cycle: MonthlyReportBillingCycleItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BillingCycleReportDetailModal({
  cycle,
  isOpen,
  onClose,
}: BillingCycleReportDetailModalProps) {
  if (!cycle) return null;

  const txnTotal = cycle.transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const installmentTotal = cycle.installmentDues.reduce(
    (sum, due) => sum + due.amount,
    0,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={cycleDisplayName(cycle)}
      description={`${cycle.sourceName} · Kỳ chi tiêu ${cyclePeriodLabel(cycle)}`}
      size="lg"
    >
      <div className="flex flex-col gap-5">
        <dl className="grid grid-cols-2 gap-3 rounded-lg border border-warm-200 bg-warm-25 px-4 py-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-warm-500">Ngày sao kê</dt>
            <dd className="font-medium tabular-nums text-warm-900">
              {formatDate(cycle.statementDate)}
            </dd>
          </div>
          <div>
            <dt className="text-warm-500">Hạn thanh toán</dt>
            <dd className="font-medium tabular-nums text-warm-900">
              {formatDate(cycle.paymentDueDate)}
            </dd>
          </div>
          <div>
            <dt className="text-warm-500">Tổng phát sinh</dt>
            <dd className="font-mono font-semibold tabular-nums text-warm-900">
              {formatCurrency(cycle.totalAmount)}
            </dd>
          </div>
        </dl>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-warm-800">
              Giao dịch trả sau
            </h4>
            <span className="text-xs tabular-nums text-warm-500">
              {cycle.transactions.length} dòng · {formatCurrency(txnTotal)}
            </span>
          </div>
          <DeferredTxnTable txns={cycle.transactions} />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-warm-800">
              Trả góp phải thanh toán
            </h4>
            <span className="text-xs tabular-nums text-warm-500">
              {cycle.installmentDues.length} kỳ · {formatCurrency(installmentTotal)}
            </span>
          </div>
          <InstallmentDueTable dues={cycle.installmentDues} />
        </section>

        <footer className="flex flex-col gap-1.5 border-t border-warm-200 pt-4 text-sm">
          <div className="flex items-center justify-between text-warm-600">
            <span>Giao dịch trả sau</span>
            <span className="font-mono tabular-nums">
              {formatCurrency(txnTotal)}
            </span>
          </div>
          <div className="flex items-center justify-between text-warm-600">
            <span>Trả góp</span>
            <span className="font-mono tabular-nums">
              {formatCurrency(installmentTotal)}
            </span>
          </div>
          {cycle.paidAmount > 0 ? (
            <div className="flex items-center justify-between text-warm-600">
              <span>Đã thanh toán</span>
              <span className="font-mono tabular-nums">
                {formatCurrency(cycle.paidAmount)}
              </span>
            </div>
          ) : null}
          <div className="flex items-center justify-between font-semibold text-warm-800">
            <span>Tổng phát sinh</span>
            <span className="font-mono tabular-nums">
              {formatCurrency(cycle.totalAmount)}
            </span>
          </div>
        </footer>
      </div>
    </Modal>
  );
}
