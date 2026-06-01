import type { MonthlyReport } from "../types";

export type ReportRecentTxnRow = {
  id: string;
  title: string;
  category: string;
  date: string;
  amount: number;
};

export function extractReportRecentTransactions(
  report: MonthlyReport,
  limit = 5,
): ReportRecentTxnRow[] {
  const rows: ReportRecentTxnRow[] = [];

  for (const item of report.directExpenses.items) {
    rows.push({
      id: item.id,
      title: item.description,
      category: item.categoryName?.trim() || item.sourceName,
      date: item.txnDate,
      amount: item.amount,
    });
  }

  for (const cycle of report.billingCycles.cycles) {
    for (const txn of cycle.transactions) {
      rows.push({
        id: txn.id,
        title: txn.description,
        category: txn.categoryName?.trim() || cycle.sourceName,
        date: txn.txnDate,
        amount: txn.amount,
      });
    }
  }

  return rows
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}
