export type SourceBalanceLedgerEntryKind = "opening" | "transaction";

export interface SourceBalanceLedgerEntry {
  entryKind: SourceBalanceLedgerEntryKind;
  transactionId: string | null;
  transactionType: string | null;
  txnDate: string;
  description: string;
  delta: number;
  balanceAfter: number;
}

export interface SourceBalanceLedger {
  sourceId: string;
  sourceName: string;
  currency: string;
  storedBalance: number;
  computedBalance: number;
  drift: number;
  entries: SourceBalanceLedgerEntry[];
}

export interface CreateBalanceAdjustmentPayload {
  amount: number;
  txnDate: string;
  note: string;
}
