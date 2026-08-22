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

import type { TransactionType, TxnStatus } from "../types";

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
    balanceAdjustment: "balance_adjustment",
    balance_adjustment: "balance_adjustment",
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
    case "balance_adjustment":
      return Scale;
    case "direct":
    default:
      return Banknote;
  }
}

export function transactionTypeLabel(
  type: TransactionType,
  t: (key: string) => string): string {
  return t(`types.${type}`);
}

/** Dấu hiển thị và class màu theo spec Sprint 3. */
export function txnAmountPresentation(
  type: TransactionType,
  amount: number,
  opts?: {
    hasInstallmentPlan?: boolean;
    isInstallmentPayment?: boolean;
  },
): { sign: string; className: string } {
  let sign: string;
  let className: string;

  if (type === "reversal") {
    sign = "";
    className = "text-warm-400 line-through italic";
  } else if (isTransferTxnType(type) || type === "balance_adjustment") {
    sign = amount < 0 ? "−" : amount > 0 ? "+" : "";
    className = "text-warm-600";
  } else if (isIncomeTxnType(type)) {
    sign = "+";
    className = "text-success";
  } else {
    sign = "−";
    className = "text-danger";
  }

  if (opts?.hasInstallmentPlan || opts?.isInstallmentPayment) {
    className = "text-amber-600";
  }

  return { sign, className };
}

export function normalizeTxnStatus(raw: string): TxnStatus {
  const map: Record<string, TxnStatus> = {
    new: "new",
    pending: "new",
    transferredToInstallment: "transferredToInstallment",
    transferred_to_installment: "transferredToInstallment",
    statemented: "statemented",
    completed: "completed",
    cancelled: "cancelled",
  };
  return map[raw] ?? "new";
}

export function txnStatusLabel(status: TxnStatus): string {
  switch (status) {
    case "new":
      return "Giao dịch mới";
    case "transferredToInstallment":
      return "Đã chuyển trả góp";
    case "statemented":
      return "Đã sao kê";
    case "completed":
      return "Hoàn thành";
    case "cancelled":
      return "Đã hủy";
    default:
      return "Giao dịch mới";
  }
}

export function txnStatusBadgeClasses(status: TxnStatus): string {
  switch (status) {
    case "new":
      return "bg-accent/10 text-accent-emphasis ring-1 ring-accent/25";
    case "transferredToInstallment":
      return "bg-amber-100 text-amber-900 ring-1 ring-amber-200";
    case "statemented":
      return "bg-sky-100 text-sky-900 ring-1 ring-sky-200";
    case "completed":
      return "bg-success/10 text-success ring-1 ring-success/20";
    case "cancelled":
      return "bg-warm-100 text-warm-500 ring-1 ring-warm-200";
    default:
      return "bg-warm-100 text-warm-500 ring-1 ring-warm-200";
  }
}

export function isInstallmentRelatedTxn(tx: {
  hasInstallmentPlan?: boolean;
  isInstallmentPayment?: boolean;
}): boolean {
  return Boolean(tx.hasInstallmentPlan || tx.isInstallmentPayment);
}
