import type { MonthlyReport } from "../types";
import type { CategoryExpenseFilter } from "./categoryBreakdownFilter";

export interface ReportExpenseLine {
  txnDate: string;
  amount: number;
  categoryId: string | null;
  categoryName: string | null;
  kind: "direct" | "creditCard" | "installment";
}

export function extractReportExpenseLines(
  report: Pick<MonthlyReport, "directExpenses" | "billingCycles">,
  filter: CategoryExpenseFilter,
): ReportExpenseLine[] {
  const lines: ReportExpenseLine[] = [];

  if (filter === "all" || filter === "transactions") {
    for (const item of report.directExpenses.items) {
      lines.push({
        txnDate: item.txnDate,
        amount: item.amount,
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        kind: "direct",
      });
    }
    for (const cycle of report.billingCycles.cycles) {
      for (const txn of cycle.transactions) {
        lines.push({
          txnDate: txn.txnDate,
          amount: txn.amount,
          categoryId: txn.categoryId,
          categoryName: txn.categoryName,
          kind: "creditCard",
        });
      }
    }
  }

  if (filter === "all" || filter === "installments") {
    for (const cycle of report.billingCycles.cycles) {
      for (const due of cycle.installmentDues) {
        lines.push({
          txnDate: due.dueDate,
          amount: due.amount,
          categoryId: due.categoryId,
          categoryName: due.categoryName,
          kind: "installment",
        });
      }
    }
  }

  return lines;
}
