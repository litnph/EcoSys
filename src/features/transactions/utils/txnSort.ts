import type { Transaction, TransactionType } from "../types";
import type { TransactionSortBy } from "../types";

export function sortTransactions(
  rows: Transaction[],
  sortBy: TransactionSortBy,
): Transaction[] {
  const out = [...rows];
  const cmpStr = (a: string, b: string) => a.localeCompare(b, "vi");

  out.sort((a, b) => {
    switch (sortBy) {
      case "dateAsc":
        return cmpStr(a.txnDate, b.txnDate);
      case "categoryAsc":
        return cmpStr(
          a.categoryName?.trim() || "zzz",
          b.categoryName?.trim() || "zzz",
        );
      case "categoryDesc":
        return cmpStr(
          b.categoryName?.trim() || "",
          a.categoryName?.trim() || "",
        );
      case "typeAsc":
        return cmpStr(
          a.sourceName?.trim() || "zzz",
          b.sourceName?.trim() || "zzz",
        );
      case "typeDesc":
        return cmpStr(
          b.sourceName?.trim() || "",
          a.sourceName?.trim() || "",
        );
      case "amountAsc":
        return a.amount - b.amount;
      case "amountDesc":
        return b.amount - a.amount;
      case "dateDesc":
      default:
        return cmpStr(b.txnDate, a.txnDate);
    }
  });
  return out;
}

export const TRANSACTION_TYPE_COLORS: Partial<Record<TransactionType, string>> =
  {
    direct: "#64748b",
    income: "#10b981",
    deferred: "#6366f1",
    transfer: "#2563eb",
    split: "#8b5cf6",
    debt_borrow: "#f97316",
    debt_repay: "#ef4444",
    loan_give: "#ec4899",
    loan_collect: "#14b8a6",
    balance_adjustment: "#78716c",
    reversal: "#94a3b8",
  };
