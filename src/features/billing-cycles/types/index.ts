export type BillingCycleStatus = "open" | "closed" | "paid" | "overdue";

export type BillingCycleItemInclusionSource = "refresh" | "manualAdd";

export interface BillingCycle {
  id: string;
  sourceId: string;
  sourceName: string;
  name: string;
  periodStart: string;
  periodEnd: string;
  statementDate: string;
  paymentDueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: BillingCycleStatus;
  closedAt: string | null;
  paidAt: string | null;
  lastRefreshedAt: string | null;
  reconciliationNote: string | null;
  issuerStatementAmount: number | null;
}

export interface RefreshCycleResult {
  cycle: BillingCycle;
  addedCount: number;
  skippedCount: number;
}

export interface PayCyclePayload {
  paymentSourceId: string;
  amount: number;
}

export type InstallmentPayLineStatus =
  | "upcoming"
  | "due"
  | "paid"
  | "overdue";

/** Kỳ trả góp phải thanh toán trong tháng sao kê. */
export interface BillingCycleInstallmentDue {
  payId: string;
  planId: string;
  originalTxnId: string;
  planDescription: string;
  categoryName: string | null;
  installmentNumber: number;
  totalInstallments: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: InstallmentPayLineStatus;
}
