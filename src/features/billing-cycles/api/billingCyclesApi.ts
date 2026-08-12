import type { ApiResponse } from "@/shared/types/api";
import { apiClient } from "@/shared/lib/axios";
import { toApiWholeAmount } from "@/shared/lib/currencyUnits";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";

import { normalizeTxnType, normalizeTxnStatus } from "@/features/transactions/utils/txnDisplay";
import type {
  Transaction,
  TransactionType,
} from "@/features/transactions/types";

import type {
  BillingCycle,
  BillingCycleInstallmentDue,
  BillingCycleItemInclusionSource,
  BillingCycleStatus,
  InstallmentPayLineStatus,
  PayCyclePayload,
  RefreshCycleResult,
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

interface RemoteBillingCycleDto {
  id: string;
  sourceId: string;
  sourceName: string;
  name?: string;
  periodStart: string;
  periodEnd: string;
  statementDate: string;
  paymentDueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: BillingCycleStatus;
  closedAt?: string | null;
  paidAt?: string | null;
  lastRefreshedAt?: string | null;
  reconciliationNote?: string | null;
  issuerStatementAmount?: number | null;
}

interface ListEnvelope {
  items: RemoteBillingCycleDto[];
}

interface CycleEnvelope {
  cycle: RemoteBillingCycleDto;
}

interface RefreshEnvelope {
  cycle: RemoteBillingCycleDto;
  addedCount: number;
  skippedCount: number;
}

interface DetailEnvelope {
  detail: {
    cycle: RemoteBillingCycleDto;
    transactions: RemoteBillingTxnDto[];
    installmentDues?: RemoteInstallmentDueDto[];
  };
}

interface RemoteInstallmentDueDto {
  payId: string;
  planId: string;
  originalTxnId: string;
  planDescription: string;
  categoryName?: string | null;
  installmentNumber: number;
  totalInstallments: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: string;
}

interface RemoteBillingTxnDto {
  id: string;
  type: string;
  purpose?: Transaction["purpose"];
  status: string;
  amount: number;
  currency: string;
  txnDate: string;
  sourceId: string;
  sourceName: string;
  categoryId?: string | null;
  categoryName?: string | null;
  description: string;
  note?: string | null;
  inclusionSource?: string;
  createdAt: string;
}

function mapInstallmentPayStatus(raw: string): InstallmentPayLineStatus {
  const s = raw.toLowerCase();
  if (s === "paid") return "paid";
  if (s === "due") return "due";
  if (s === "overdue") return "overdue";
  return "upcoming";
}

function mapInstallmentDue(row: RemoteInstallmentDueDto): BillingCycleInstallmentDue {
  return {
    payId: row.payId,
    planId: row.planId,
    originalTxnId: row.originalTxnId,
    planDescription: row.planDescription,
    categoryName: row.categoryName ?? null,
    installmentNumber: row.installmentNumber,
    totalInstallments: row.totalInstallments,
    dueDate: row.dueDate,
    amount: row.amount,
    paidAmount: row.paidAmount,
    status: mapInstallmentPayStatus(row.status),
  };
}

function mapInclusionSource(
  raw?: string | null,
): BillingCycleItemInclusionSource {
  if (raw === "manual_add" || raw === "manualAdd") return "manualAdd";
  return "refresh";
}

function mapCycle(row: RemoteBillingCycleDto): BillingCycle {
  return {
    id: row.id,
    sourceId: row.sourceId,
    sourceName: row.sourceName,
    name: row.name?.trim() ?? "",
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    statementDate: row.statementDate,
    paymentDueDate: row.paymentDueDate,
    totalAmount: Number(row.totalAmount),
    paidAmount: Number(row.paidAmount),
    status: row.status,
    closedAt: row.closedAt ?? null,
    paidAt: row.paidAt ?? null,
    lastRefreshedAt: row.lastRefreshedAt ?? null,
    reconciliationNote: row.reconciliationNote ?? null,
    issuerStatementAmount:
      typeof row.issuerStatementAmount === "number"
        ? row.issuerStatementAmount
        : null,
  };
}

function mapBillingDetailTxn(row: RemoteBillingTxnDto): Transaction {
  return {
    id: row.id,
    type: normalizeTxnType(row.type),
    purpose: row.purpose ?? "general",
    status: normalizeTxnStatus(row.status),
    amount: row.amount,
    currency: row.currency,
    sourceId: row.sourceId,
    sourceName: row.sourceName,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    txnDate: row.txnDate,
    note: row.note,
    description: row.description,
    createdAt: row.createdAt,
    inclusionSource: mapInclusionSource(row.inclusionSource),
  };
}

export async function getBillingCycles(
  sourceId?: string,
  status?: BillingCycleStatus,
): Promise<BillingCycle[]> {
  const qs = new URLSearchParams();
  if (sourceId) qs.set("source_id", sourceId);
  if (status) qs.set("status", status);
  const query = qs.toString();
  const envelope = await unwrap<ListEnvelope>(
    apiClient.get(
      `/finance/billing-cycles${query ? `?${query}` : ""}`,
    ),
  );
  return envelope.items.map(mapCycle);
}

export interface BillingCycleDetailResult {
  cycle: BillingCycle;
  transactions: Transaction[];
  installmentDues: BillingCycleInstallmentDue[];
}

interface RemoteAddableTxnDto {
  id: string;
  type: string;
  purpose?: Transaction["purpose"];
  status: string;
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

interface AddableTransactionsEnvelope {
  items: RemoteAddableTxnDto[];
}

function mapAddableTxn(row: RemoteAddableTxnDto): Transaction {
  return {
    id: row.id,
    type: normalizeTxnType(row.type) as TransactionType,
    purpose: row.purpose ?? "general",
    status: normalizeTxnStatus(row.status),
    amount: row.amount,
    currency: row.currency,
    sourceId: row.sourceId,
    sourceName: row.sourceName,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    txnDate: row.txnDate,
    note: row.note,
    description: row.description,
    createdAt: row.createdAt,
  };
}

/** Giao dịch trả sau mới trên cùng thẻ, chưa thuộc kỳ sao kê nào. */
export async function getBillingCycleAddableTransactions(
  cycleId: string,
): Promise<Transaction[]> {
  const envelope = await unwrap<AddableTransactionsEnvelope>(
    apiClient.get(`/finance/billing-cycles/${cycleId}/addable-transactions`),
  );
  return envelope.items.map(mapAddableTxn);
}

export async function getBillingCycleDetail(
  id: string,
): Promise<BillingCycleDetailResult> {
  const envelope = await unwrap<DetailEnvelope>(
    apiClient.get(`/finance/billing-cycles/${id}`),
  );
  const rawCycle = envelope.detail.cycle;
  const cycle = mapCycle(rawCycle);
  const transactions = envelope.detail.transactions.map(mapBillingDetailTxn);
  const installmentDues = (envelope.detail.installmentDues ?? []).map(
    mapInstallmentDue,
  );
  return { cycle, transactions, installmentDues };
}

export interface GenerateCyclePayload {
  sourceId: string;
  statementYear?: number;
  statementMonth?: number;
}

export async function generateCycle(
  payload: GenerateCyclePayload,
): Promise<BillingCycle> {
  const envelope = await unwrap<CycleEnvelope>(
    apiClient.post(`/finance/billing-cycles/generate`, {
      sourceId: payload.sourceId,
      statementYear: payload.statementYear ?? null,
      statementMonth: payload.statementMonth ?? null,
    }),
  );
  return mapCycle(envelope.cycle);
}

export async function deleteCycle(id: string): Promise<void> {
  await unwrap<CycleEnvelope>(apiClient.delete(`/finance/billing-cycles/${id}`));
}

export async function addCycleItem(
  cycleId: string,
  transactionId: string,
): Promise<RefreshCycleResult> {
  const envelope = await unwrap<RefreshEnvelope>(
    apiClient.post(`/finance/billing-cycles/${cycleId}/items`, { transactionId }),
  );
  return {
    cycle: mapCycle(envelope.cycle),
    addedCount: envelope.addedCount,
    skippedCount: envelope.skippedCount,
  };
}

export async function removeCycleItem(
  cycleId: string,
  transactionId: string,
): Promise<RefreshCycleResult> {
  const envelope = await unwrap<RefreshEnvelope>(
    apiClient.delete(
      `/finance/billing-cycles/${cycleId}/items/${transactionId}`,
    ),
  );
  return {
    cycle: mapCycle(envelope.cycle),
    addedCount: envelope.addedCount,
    skippedCount: envelope.skippedCount,
  };
}

export async function refreshCycle(id: string): Promise<RefreshCycleResult> {
  const envelope = await unwrap<RefreshEnvelope>(
    apiClient.post(`/finance/billing-cycles/${id}/refresh`),
  );
  return {
    cycle: mapCycle(envelope.cycle),
    addedCount: envelope.addedCount,
    skippedCount: envelope.skippedCount,
  };
}

export async function closeCycle(id: string): Promise<BillingCycle> {
  const envelope = await unwrap<CycleEnvelope>(
    apiClient.post(`/finance/billing-cycles/${id}/close`),
  );
  return mapCycle(envelope.cycle);
}

export async function payCycle(
  id: string,
  body: PayCyclePayload,
): Promise<BillingCycle> {
  const envelope = await unwrap<CycleEnvelope>(
    apiClient.post(`/finance/billing-cycles/${id}/pay`, {
      paymentSourceId: body.paymentSourceId,
      amount: toApiWholeAmount(body.amount),
    }),
  );
  return mapCycle(envelope.cycle);
}

export interface ReconciliationPayload {
  reconciliationNote?: string | null;
  issuerStatementAmount?: number | null;
}

export async function updateCycleReconciliation(
  id: string,
  body: ReconciliationPayload,
): Promise<BillingCycle> {
  const envelope = await unwrap<CycleEnvelope>(
    apiClient.patch(`/finance/billing-cycles/${id}/reconciliation`, {
      reconciliationNote: body.reconciliationNote ?? null,
      issuerStatementAmount:
        body.issuerStatementAmount != null
          ? toApiWholeAmount(body.issuerStatementAmount)
          : null,
    }),
  );
  return mapCycle(envelope.cycle);
}
