import {
  ArrowLeftRight,
  Banknote,
  CreditCard,
  type LucideIcon,
  PiggyBank,
  Scale,
  Split,
  Undo2,
} from "lucide-react";

import type { TransactionType } from "../types";

export function normalizeTxnType(raw: string): TransactionType {
  const map: Record<string, TransactionType> = {
    direct: "direct",
    deferred: "deferred",
    income: "income",
    transfer: "transfer",
    split: "split",
    debtBorrow: "debt_borrow",
    debtRepay: "debt_repay",
    loanGive: "loan_give",
    loanCollect: "loan_collect",
    reversal: "reversal",
    debt_borrow: "debt_borrow",
    debt_repay: "debt_repay",
    loan_give: "loan_give",
    loan_collect: "loan_collect",
  };
  return map[raw] ?? (raw as TransactionType);
}

const EXPENSE_TYPES = new Set<TransactionType>([
  "direct",
  "deferred",
  "split",
  "loan_give",
  "debt_repay",
]);

const INCOME_TYPES = new Set<TransactionType>([
  "income",
  "loan_collect",
  "debt_borrow",
]);

export function isExpenseTxnType(type: TransactionType): boolean {
  return EXPENSE_TYPES.has(type);
}

export function isIncomeTxnType(type: TransactionType): boolean {
  return INCOME_TYPES.has(type);
}

export function isTransferTxnType(type: TransactionType): boolean {
  return type === "transfer";
}

export function transactionTypeIcon(type: TransactionType): LucideIcon {
  switch (type) {
    case "income":
      return PiggyBank;
    case "transfer":
      return ArrowLeftRight;
    case "deferred":
      return CreditCard;
    case "split":
      return Split;
    case "debt_borrow":
    case "debt_repay":
    case "loan_give":
    case "loan_collect":
      return Scale;
    case "reversal":
      return Undo2;
    case "direct":
    default:
      return Banknote;
  }
}

export function transactionTypeLabel(
  type: TransactionType,
  t: (key: string) => string,
): string {
  return t(`types.${type}`);
}

/** Dấu hiển thị và class màu theo spec Sprint 3. */
export function txnAmountPresentation(
  type: TransactionType,
  amount: number,
): { sign: string; className: string } {
  if (type === "reversal") {
    return { sign: "", className: "text-warm-400 line-through italic" };
  }
  if (isTransferTxnType(type)) {
    return {
      sign: amount < 0 ? "−" : amount > 0 ? "+" : "",
      className: "text-warm-600",
    };
  }
  if (isIncomeTxnType(type)) {
    return { sign: "+", className: "text-success" };
  }
  return { sign: "−", className: "text-danger" };
}
