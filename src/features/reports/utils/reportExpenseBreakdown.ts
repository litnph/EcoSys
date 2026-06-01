import type { MonthlyReport } from "../types";

export interface ReportExpenseBreakdown {
  /** Chi trả trực tiếp (tiền mặt / ngân hàng). */
  directAmount: number;
  /** Chi quẹt thẻ / trả sau trong kỳ sao kê phát hành tháng này. */
  cardSpendAmount: number;
  /** Chi tiêu giao dịch = trực tiếp + quẹt thẻ (không gồm trả góp). */
  transactionSpendAmount: number;
  /** Kỳ trả góp đến hạn trong các kỳ sao kê tháng này. */
  installmentAmount: number;
  totalExpense: number;
  totalIncome: number;
  net: number;
  savingsRate: number | null;
}

export function computeReportExpenseBreakdown(
  report: Pick<
    MonthlyReport,
    | "directExpenses"
    | "billingCycles"
    | "totalIncome"
    | "totalExpense"
    | "net"
    | "savingsRate"
  >,
): ReportExpenseBreakdown {
  const directAmount = report.directExpenses.totalAmount;
  const cardSpendAmount = report.billingCycles.cycles.reduce(
    (sum, cycle) =>
      sum + cycle.transactions.reduce((s, txn) => s + txn.amount, 0),
    0,
  );
  const installmentAmount = report.billingCycles.cycles.reduce(
    (sum, cycle) =>
      sum + cycle.installmentDues.reduce((s, due) => s + due.amount, 0),
    0,
  );

  return {
    directAmount,
    cardSpendAmount,
    transactionSpendAmount: directAmount + cardSpendAmount,
    installmentAmount,
    totalExpense: report.totalExpense,
    totalIncome: report.totalIncome,
    net: report.net,
    savingsRate: report.savingsRate,
  };
}
