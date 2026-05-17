export type DebtDirection = "borrowed" | "lent";

export type DebtStatus = "active" | "completed" | "cancelled";

export type DebtTxnType = "payment" | "collection";

export interface DebtTransaction {
  id: string;
  txnId: string | null;
  amount: number;
  type: DebtTxnType;
  note: string | null;
  txnDate: string;
  createdAt: string;
}

/** Bản ghi từ API chi tiết (ledger đầy đủ). */
export interface DebtRecord {
  id: string;
  smoduleId: string;
  direction: DebtDirection;
  personName: string | null;
  personContact: string | null;
  originalTxnId: string | null;
  originalAmount: number;
  remainingAmount: number;
  currency: string;
  dueDate: string | null;
  status: DebtStatus;
  note: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  transactions: DebtTransaction[];
}

/** Bản ghi từ API danh sách. */
export interface DebtRecordListItem {
  id: string;
  smoduleId: string;
  direction: DebtDirection;
  personName: string | null;
  personContact: string | null;
  originalAmount: number;
  remainingAmount: number;
  currency: string | null;
  dueDate: string | null;
  status: DebtStatus;
  daysUntilDue: number | null;
  createdAt: string;
}

export interface DebtSummary {
  totalBorrowedRemaining: number;
  totalLentRemaining: number;
  overdueBorrowedCount: number;
  overdueLentCount: number;
}
