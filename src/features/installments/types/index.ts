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
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: InstallmentPayLineStatus;
  paidAt: string | null;
  linkedTxnId?: string | null;
}

/** Kế hoạch trả góp đầy đủ (từ GET …/installment-plans/:id). */
export interface InstallmentPlan {
  id: string;  originalTxnId: string;
  sourceId: string;
  sourceName: string | null;
  originalTxnDescription: string | null;
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
  pays: InstallmentPay[];
}

/** Bản tóm tắt danh sách (GET …/installment-plans). */
export interface InstallmentPlanListItem {
  id: string;  sourceId: string;
  sourceName: string | null;
  originalTxnDescription: string | null;
  status: InstallmentStatus;
  paidInstallments: number;
  totalInstallments: number;
  remainingAmount: number;
  createdAt: string;
}

export interface CreateInstallmentPlanPayload {
  originalTxnId: string;
  totalMonths: number;
  interestRate: number;
  conversionFeeRate: number | null;
}
