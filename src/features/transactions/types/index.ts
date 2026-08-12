export const TRANSACTION_TYPES = [
  "direct",
  "income",
  "transfer",
  "deferred",
  "split",
  "debt_borrow",
  "debt_repay",
  "loan_give",
  "loan_collect",
  "reversal",
  "balance_adjustment",
] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export type TransactionPurpose =
  | "general"
  | "statementPayment"
  | "installmentPayment"
  | "conversionFee"
  | "savingDeposit"
  | "savingWithdrawal"
  | "refund";

export type TxnStatus =
  | "new"
  | "transferredToInstallment"
  | "completed"
  | "cancelled";

export type TransactionGroupBy = "none" | "day";

export type TransactionSortBy =
  | "dateDesc"
  | "dateAsc"
  | "categoryAsc"
  | "categoryDesc"
  | "typeAsc"
  | "typeDesc"
  | "amountDesc"
  | "amountAsc";

export type HistoryChangeType =
  | "created"
  | "updated"
  | "deleted"
  | "restored"
  | "cancelled";

/** Bộ lọc gửi API (một type / một source theo contract backend hiện tại). */
export interface TransactionFilters {
  sourceId?: string;
  type?: TransactionType;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  status?: TxnStatus;
  page: number;
  pageSize: number;
}

/** Trạng thái UI: hỗ trợ chọn nhiều nguồn / nhiều loại — map xuống API + lọc client khi cần. */
export interface TransactionFilterState {
  /** `all` | `YYYY-MM` (kỳ hiển thị) | `custom` (khoảng ngày tùy chỉnh). */
  billingPeriod: string;
  sourceIds: string[];
  types: TransactionType[];
  parentCategoryId?: string;
  categoryId?: string;
  categoryKind: "expense" | "income" | "transfer";
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  status?: TxnStatus;
  groupBy: TransactionGroupBy;
  sortBy: TransactionSortBy;
}

export interface TransactionTag {
  id: string;
  name: string;
  color: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  purpose: TransactionPurpose;
  amount: number;
  currency: string;
  sourceId: string;
  sourceName: string;
  categoryId?: string | null;
  categoryName?: string | null;
  txnDate: string;
  note?: string | null;
  description?: string | null;
  refTxnId?: string | null;
  savingId?: string | null;
  billingCycleId?: string | null;
  /** Present on billing-cycle detail lines only. */
  inclusionSource?: "refresh" | "manualAdd";
  status: TxnStatus;
  createdAt: string;
  version?: number;
  /** Giao dịch gốc đã chuyển sang trả góp. */
  hasInstallmentPlan?: boolean;
  /** Giao dịch thanh toán một kỳ trả góp. */
  isInstallmentPayment?: boolean;
  /** Giao dịch đã gắn vào một kỳ sao kê (fin_billing_cycle_items active). */
  isOnBillingCycle?: boolean;
  /** Tháng sao kê (YYYY-MM) của kỳ đang gắn; null nếu chưa vào sao kê. */
  billingCycleStatementMonth?: string | null;
  tags?: TransactionTag[];
}

export interface TransactionSourceInfo {
  id: string;
  name: string;
  currency: string;
  balance: number;
}

export interface TransactionCategoryInfo {
  id: string;
  name: string;
  kind: string;
}

export interface TransactionDetail extends Transaction {
  monthlyPeriodId?: string | null;
  updatedAt: string;
  version: number;
  canEditAmount?: boolean;
  canDelete?: boolean;
  hasInstallmentPlan?: boolean;
  isInstallmentPayment?: boolean;
  source: TransactionSourceInfo | null;
  category: TransactionCategoryInfo | null;
}

export interface FinTransactionHistory {
  id: string;
  transactionId: string;
  version: number;
  changedBy?: string | null;
  sessionId?: string | null;
  changeType: HistoryChangeType;
  changedFields?: string | null;
  snapshot?: string | null;
  changeReason?: string | null;
  createdAt: string;
}

export interface TransactionAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  isPublic: boolean;
  uploadedAtUtc: string;
  uploadedBy: string;
}

export interface TransactionsPage {
  items: Transaction[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
