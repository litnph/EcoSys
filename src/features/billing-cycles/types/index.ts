export type BillingCycleStatus = "open" | "closed" | "paid" | "overdue";

export interface BillingCycle {
  id: string;
  sourceId: string;
  sourceName: string;
  periodStart: string;
  periodEnd: string;
  statementDate: string;
  paymentDueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: BillingCycleStatus;
  closedAt: string | null;
  paidAt: string | null;
}

export interface PayCyclePayload {
  paymentSourceId: string;
  amount: number;
}
