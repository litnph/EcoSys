export type TransactionType =
  | "direct"
  | "deferred"
  | "income"
  | "transfer"
  | "split"
  | "debt_borrow"
  | "debt_repay"
  | "loan_give"
  | "loan_collect"
  | "reversal";

export type TxnStatus = "pending" | "completed" | "cancelled";

export interface Transaction {
  id: string;
  smoduleId: string;
  type: TransactionType;
  status: TxnStatus;
  amount: number;
  currency: string;
  txnDate: string;
  sourceId: string;
  sourceName: string;
  categoryId?: string | null;
  categoryName?: string | null;
  description: string;
  note?: string | null;
  createdAt: string;
}

export interface DashboardSummary {
  netWorth: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlySavingsRate: number;
  previousMonthNet: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface SourceSummary {
  sourceId: string;
  sourceName: string;
  type: string;
  balance: number;
  creditLimit: number | null;
  usedPercentage: number | null;
}

export interface MonthlyTrendPoint {
  year: number;
  month: number;
  income: number;
  expense: number;
}

export type BillingCycleStatus =
  | "open"
  | "closed"
  | "paid"
  | "overdue";

export interface BillingCycleDue {
  id: string;
  sourceId: string;
  sourceName: string;
  paymentDueDate: string;
  amountDue: number;
  status: BillingCycleStatus;
}

export type InstallmentPayLineStatus =
  | "upcoming"
  | "due"
  | "paid"
  | "overdue";

export interface InstallmentPayDue {
  planId: string;
  planDescription: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  remainingAmount: number;
  status: InstallmentPayLineStatus;
}

export interface UpcomingDuesPayload {
  billingCycles: BillingCycleDue[];
  installmentPays: InstallmentPayDue[];
}
