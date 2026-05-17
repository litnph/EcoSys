import type { ApiResponse } from "@/shared/types/api";
import { apiClient } from "@/shared/lib/axios";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";

import type {
  DebtDirection,
  DebtRecord,
  DebtRecordListItem,
  DebtStatus,
  DebtSummary,
  DebtTransaction,
  DebtTxnType,
} from "../types";

type ApiEnvelope<T> = ApiResponse<T>;

function assertData<T>(body: ApiEnvelope<T>): asserts body is ApiEnvelope<T> & {
  success: true;
  data: T;
} {
  if (!body.success) {
    throw new Error(getFailureMessageFromApiBody(body));
  }
  if (body.data === null || body.data === undefined) {
    throw new Error("Phản hồi API không hợp lệ");
  }
}

async function unwrap<T>(getter: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const { data: body } = await getter;
  assertData(body);
  return body.data;
}

interface RemoteDebtRecordRow {
  id: string;
  smoduleId: string;
  direction: DebtDirection;
  personName?: string | null;
  personContact?: string | null;
  originalAmount: number;
  remainingAmount: number;
  currency?: string | null;
  dueDate?: string | null;
  status: DebtStatus;
  daysUntilDue?: number | null;
  createdAt: string;
}

interface RemoteDebtListBody {
  items: RemoteDebtRecordRow[] | null;
}

function mapDebtListRow(row: RemoteDebtRecordRow): DebtRecordListItem {
  return {
    id: row.id,
    smoduleId: row.smoduleId,
    direction: row.direction,
    personName: row.personName ?? null,
    personContact: row.personContact ?? null,
    originalAmount: row.originalAmount,
    remainingAmount: row.remainingAmount,
    currency: row.currency ?? null,
    dueDate: row.dueDate ?? null,
    status: row.status,
    daysUntilDue: row.daysUntilDue ?? null,
    createdAt: row.createdAt,
  };
}

export async function getDebtRecords(
  smoduleId: string,
  options?: {
    direction?: DebtDirection;
    status?: DebtStatus;
  },
): Promise<DebtRecordListItem[]> {
  const qs = new URLSearchParams({ smodule_id: smoduleId });
  if (options?.direction) qs.set("direction", options.direction);
  if (options?.status) qs.set("status", options.status);
  const envelope = await unwrap<RemoteDebtListBody>(
    apiClient.get(`/finance/debt-records?${qs.toString()}`),
  );
  return (envelope.items ?? []).map(mapDebtListRow);
}

interface RemoteDebtSummaryBody {
  totalBorrowedRemaining: number;
  totalLentRemaining: number;
  overdueBorrowedCount: number;
  overdueLentCount: number;
}

export async function getDebtSummary(smoduleId: string): Promise<DebtSummary> {
  const qs = new URLSearchParams({ smodule_id: smoduleId });
  return unwrap<RemoteDebtSummaryBody>(
    apiClient.get(`/finance/debt-records/summary?${qs.toString()}`),
  );
}

interface RemoteDebtTxn {
  id: string;
  txnId?: string | null;
  amount: number;
  type: DebtTxnType;
  note?: string | null;
  txnDate: string;
  createdAt: string;
}

interface RemoteDebtRecordDetail {
  id: string;
  smoduleId: string;
  direction: DebtDirection;
  personName: string;
  personContact?: string | null;
  originalTxnId?: string | null;
  originalAmount: number;
  remainingAmount: number;
  currency: string;
  dueDate?: string | null;
  status: DebtStatus;
  note?: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  transactions: RemoteDebtTxn[] | null;
}

interface RemoteDebtDetailBody {
  record: RemoteDebtRecordDetail;
}

function mapDebtTxn(row: RemoteDebtTxn): DebtTransaction {
  return {
    id: row.id,
    txnId: row.txnId ?? null,
    amount: row.amount,
    type: row.type,
    note: row.note ?? null,
    txnDate: row.txnDate,
    createdAt: row.createdAt,
  };
}

export async function getDebtRecordDetail(id: string): Promise<DebtRecord> {
  const envelope = await unwrap<RemoteDebtDetailBody>(
    apiClient.get(`/finance/debt-records/${id}`),
  );
  const r = envelope.record;
  return {
    id: r.id,
    smoduleId: r.smoduleId,
    direction: r.direction,
    personName: r.personName?.trim() ? r.personName : null,
    personContact: r.personContact ?? null,
    originalTxnId: r.originalTxnId ?? null,
    originalAmount: r.originalAmount,
    remainingAmount: r.remainingAmount,
    currency: r.currency,
    dueDate: r.dueDate ?? null,
    status: r.status,
    note: r.note ?? null,
    version: r.version,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    transactions: (r.transactions ?? []).map(mapDebtTxn),
  };
}

interface RemoteDeleteDebtBody {
  debtRecordId: string;
}

export async function deleteDebtRecord(id: string): Promise<string> {
  const envelope = await unwrap<RemoteDeleteDebtBody>(
    apiClient.delete(`/finance/debt-records/${id}`),
  );
  return envelope.debtRecordId;
}
