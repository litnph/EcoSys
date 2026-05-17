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
] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export type TxnStatus = "pending" | "completed" | "cancelled";

export type HistoryChangeType =
  | "created"
  | "updated"
  | "deleted"
  | "restored"
  | "cancelled";

/** Bộ lọc gửi API (một type / một source theo contract backend hiện tại). */
export interface TransactionFilters {
  smoduleId: string;
  sourceId?: string;
  type?: TransactionType;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  page: number;
  pageSize: number;
}

/** Trạng thái UI: hỗ trợ chọn nhiều nguồn / nhiều loại — map xuống API + lọc client khi cần. */
export interface TransactionFilterState {
  sourceIds: string[];
  types: TransactionType[];
  categoryId?: string;
  categoryKind: "expense" | "income" | "transfer";
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
}

export interface Transaction {
  id: string;
  smoduleId: string;
  type: TransactionType;
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
  billingCycleId?: string | null;
  status: TxnStatus;
  createdAt: string;
  version?: number;
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
