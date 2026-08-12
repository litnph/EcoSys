export type InstallmentStatus = "active" | "completed" | "cancelled";

export type InstallmentPayLineStatus =
  | "upcoming"
  | "due"
  | "paid"
  | "overdue";

export type ConversionFeeStatus = "pending" | "billed" | "paid";

/** Chi tiết trả góp (API `InstallmentPayItemDto` + id/planId phía FE). */
export interface InstallmentPay {
  id: string;
  planId: string;
  installmentNumber: number;
  statementDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: InstallmentPayLineStatus;
  paidAt: string | null;
  linkedTxnId?: string | null;
  canPayDirectly: boolean;
}

/** Kế hoạch trả góp đầy đủ (từ GET …/installment-plans/:id). */
export interface InstallmentPlan {
  id: string;
  originalTxnId: string;
  sourceId: string;
  sourceName: string | null;
  sourceIcon?: string | null;
  sourceColor?: string | null;
  originalTxnDescription: string | null;
  originalTxnCategoryName?: string | null;
  totalAmount: number;
  totalMonths: number;
  monthlyAmount: number;
  interestRate: number;
  conversionFeeRate: number | null;
  conversionFeeAmount: number | null;
  conversionFeeStatus: ConversionFeeStatus | null;
  conversionFeeTxnId?: string | null;
  startDate: string;
  status: InstallmentStatus;
  cancellationReason?: string | null;
  canDelete?: boolean;
  version: number;
  pays: InstallmentPay[];
}

/** Bản tóm tắt danh sách (GET …/installment-plans). */
export interface InstallmentPlanListItem {
  id: string;
  sourceId: string;
  sourceName: string | null;
  sourceIcon?: string | null;
  sourceColor?: string | null;
  originalTxnDescription: string | null;
  originalTxnCategoryName?: string | null;
  status: InstallmentStatus;
  paidInstallments: number;
  totalInstallments: number;
  remainingAmount: number;
  totalAmount: number;
  canDelete: boolean;
  createdAt: string;
  version: number;
}

export interface InstallmentDashboard {
  activePlanCount: number;
  totalRemainingAmount: number;
  dueCount: number;
  dueAmount: number;
  overdueCount: number;
  overdueAmount: number;
  upcomingCount: number;
  upcomingAmount: number;
  thisMonthDueCount: number;
  thisMonthDueAmount: number;
  nextMonthDueCount: number;
  nextMonthDueAmount: number;
  completionPercent: number;
  bySource: InstallmentDashboardSource[];
  upcomingPays: InstallmentUpcomingPay[];
}

export type InstallmentUpcomingPayBucket =
  | "overdue"
  | "dueToday"
  | "thisMonth"
  | "nextMonth"
  | "later";

export interface InstallmentDashboardSource {
  sourceId: string;
  sourceName: string;
  sourceIcon?: string | null;
  sourceColor?: string | null;
  activePlanCount: number;
  remainingAmount: number;
  overdueAmount: number;
  thisMonthDueAmount: number;
  nextMonthDueAmount: number;
}

export interface InstallmentUpcomingPay {
  planId: string;
  sourceId: string;
  sourceName: string;
  sourceIcon?: string | null;
  planTitle: string;
  installmentNumber: number;
  totalInstallments: number;
  statementDate: string;
  dueDate: string;
  amount: number;
  bucket: InstallmentUpcomingPayBucket;
}

export interface CreateInstallmentPlanPayload {
  originalTxnId: string;
  totalMonths: number;
  interestRate: number;
  conversionFeeRate: number | null;
}
