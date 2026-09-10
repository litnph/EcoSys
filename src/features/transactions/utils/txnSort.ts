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
    direct: "#52525b",
    income: "#3f3f46",
    deferred: "#71717a",
    transfer: "#52525b",
    split: "#a1a1aa",
    debt_borrow: "#725a3a",
    debt_repay: "#725a3a",
    loan_give: "#71717a",
    loan_collect: "#3f3f46",
    balance_adjustment: "#52525b",
    reversal: "#a1a1aa",
  };
