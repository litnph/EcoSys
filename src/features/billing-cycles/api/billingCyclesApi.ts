import type { ApiResponse } from "@/shared/types/api";
import { apiClient } from "@/shared/lib/axios";
import { toApiWholeAmount } from "@/shared/lib/currencyUnits";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";

import { normalizeTxnType } from "@/features/transactions/utils/txnDisplay";
import type { Transaction, TxnStatus } from "@/features/transactions/types";

import type {
  BillingCycle,
  BillingCycleStatus,
  PayCyclePayload,
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
  periodStart: string;
  periodEnd: string;
  statementDate: string;
  paymentDueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: BillingCycleStatus;
  closedAt?: string | null;
  paidAt?: string | null;
}

interface ListEnvelope {
  items: RemoteBillingCycleDto[];
}

interface CycleEnvelope {
  cycle: RemoteBillingCycleDto;
}

interface DetailEnvelope {
  detail: {
    cycle: RemoteBillingCycleDto;
    transactions: RemoteBillingTxnDto[];
  };
}

interface RemoteBillingTxnDto {
  id: string;
  type: string;
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

function mapCycle(row: RemoteBillingCycleDto): BillingCycle {
  return {
    id: row.id,
    sourceId: row.sourceId,
    sourceName: row.sourceName,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    statementDate: row.statementDate,
    paymentDueDate: row.paymentDueDate,
    totalAmount: Number(row.totalAmount),
    paidAmount: Number(row.paidAmount),
    status: row.status,
    closedAt: row.closedAt ?? null,
    paidAt: row.paidAt ?? null,
  };
}

function mapBillingDetailTxn(
  row: RemoteBillingTxnDto,
  billingCycleId: string): Transaction {
  const status: TxnStatus = "completed";
  return {
    id: row.id,
    type: normalizeTxnType(row.type),
    status,
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
    billingCycleId,
  };
}

export async function getBillingCycles(
  sourceId?: string,
  status?: BillingCycleStatus): Promise<BillingCycle[]> {
  const qs = new URLSearchParams();
  if (sourceId) qs.set("source_id", sourceId);
  if (status) qs.set("status", status);
  const envelope = await unwrap<ListEnvelope>(
    apiClient.get("/finance/billing-cycles"));
  return envelope.items.map(mapCycle);
}

export interface BillingCycleDetailResult {
  cycle: BillingCycle;
  transactions: Transaction[];
}

export async function getBillingCycleDetail(
  id: string): Promise<BillingCycleDetailResult> {
  const envelope = await unwrap<DetailEnvelope>(
    apiClient.get(`/finance/billing-cycles/${id}`));
  const rawCycle = envelope.detail.cycle;
  const cycle = mapCycle(rawCycle);
  const transactions = envelope.detail.transactions.map((t) =>
    mapBillingDetailTxn(t, cycle.id),
  );
  return { cycle, transactions };
}

export async function generateCycle(sourceId: string): Promise<BillingCycle> {
  const envelope = await unwrap<CycleEnvelope>(
    apiClient.post(`/finance/billing-cycles/generate`, { sourceId }));
  return mapCycle(envelope.cycle);
}

export async function closeCycle(id: string): Promise<BillingCycle> {
  const envelope = await unwrap<CycleEnvelope>(
    apiClient.post(`/finance/billing-cycles/${id}/close`));
  return mapCycle(envelope.cycle);
}

export async function payCycle(
  id: string,
  body: PayCyclePayload): Promise<BillingCycle> {
  const envelope = await unwrap<CycleEnvelope>(
    apiClient.post(`/finance/billing-cycles/${id}/pay`, {
      paymentSourceId: body.paymentSourceId,
      amount: toApiWholeAmount(body.amount),
    }));
  return mapCycle(envelope.cycle);
}
