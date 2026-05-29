import type { ApiResponse } from "@/shared/types/api";
import { apiClient } from "@/shared/lib/axios";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";

import type {
  CreateBalanceAdjustmentPayload,
  SourceBalanceLedger,
} from "../types/balanceLedger";
import type {
  ApplySourcesRecalculateResult,
  SourceRecalculatePreviewItem,
} from "../types/recalculate";
import type { FinSourceType } from "../types";

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

interface RemoteLedgerEntry {
  entryKind: string;
  transactionId?: string | null;
  transactionType?: string | null;
  txnDate: string;
  description: string;
  delta: number;
  balanceAfter: number;
}

interface RemoteLedgerEnvelope {
  sourceId: string;
  sourceName: string;
  currency: string;
  storedBalance: number;
  computedBalance: number;
  drift: number;
  entries: RemoteLedgerEntry[];
}

function mapLedger(raw: RemoteLedgerEnvelope): SourceBalanceLedger {
  return {
    sourceId: raw.sourceId,
    sourceName: raw.sourceName,
    currency: raw.currency,
    storedBalance: raw.storedBalance,
    computedBalance: raw.computedBalance,
    drift: raw.drift,
    entries: raw.entries.map((e) => ({
      entryKind: e.entryKind as "opening" | "transaction",
      transactionId: e.transactionId ?? null,
      transactionType: e.transactionType ?? null,
      txnDate: e.txnDate,
      description: e.description,
      delta: e.delta,
      balanceAfter: e.balanceAfter,
    })),
  };
}

export async function getSourceBalanceLedger(
  sourceId: string,
): Promise<SourceBalanceLedger> {
  const envelope = await unwrap<RemoteLedgerEnvelope>(
    apiClient.get(`/finance/sources/${sourceId}/balance-ledger`));
  return mapLedger(envelope);
}

export async function createBalanceAdjustment(
  sourceId: string,
  payload: CreateBalanceAdjustmentPayload,
): Promise<{ transactionId: string; newBalance: number }> {
  return unwrap(
    apiClient.post(`/finance/sources/${sourceId}/balance-adjustments`, {
      amount: payload.amount,
      txnDate: payload.txnDate,
      note: payload.note,
    }));
}

export async function recalculateSourceBalance(
  sourceId: string,
): Promise<{ sourceId: string; previousBalance: number; newBalance: number }> {
  return unwrap(
    apiClient.post(`/finance/sources/${sourceId}/recalculate-balance`));
}

interface RemotePreviewItem {
  sourceId: string;
  name: string;
  type: string;
  currency: string;
  storedBalance: number;
  computedBalance: number;
  drift: number;
  creditLimit?: number | null;
  storedUtilizationPercent?: number | null;
  computedUtilizationPercent?: number | null;
}

interface RemotePreviewEnvelope {
  items: RemotePreviewItem[];
}

function mapPreviewItem(row: RemotePreviewItem): SourceRecalculatePreviewItem {
  return {
    sourceId: row.sourceId,
    name: row.name,
    type: row.type as FinSourceType,
    currency: row.currency,
    storedBalance: row.storedBalance,
    computedBalance: row.computedBalance,
    drift: row.drift,
    creditLimit:
      typeof row.creditLimit === "number" ? row.creditLimit : null,
    storedUtilizationPercent:
      typeof row.storedUtilizationPercent === "number"
        ? row.storedUtilizationPercent
        : null,
    computedUtilizationPercent:
      typeof row.computedUtilizationPercent === "number"
        ? row.computedUtilizationPercent
        : null,
  };
}

export async function getSourcesRecalculatePreview(): Promise<
  SourceRecalculatePreviewItem[]
> {
  const envelope = await unwrap<RemotePreviewEnvelope>(
    apiClient.get("/finance/sources/recalculate-preview"));
  return (envelope.items ?? []).map(mapPreviewItem);
}

interface RemoteApplyResult {
  sourceId: string;
  previousBalance: number;
  newBalance: number;
  applied: boolean;
}

interface RemoteApplyEnvelope {
  results: RemoteApplyResult[];
}

export async function applySourcesRecalculate(
  sourceIds: string[],
): Promise<ApplySourcesRecalculateResult[]> {
  const envelope = await unwrap<RemoteApplyEnvelope>(
    apiClient.post("/finance/sources/recalculate-balance/apply", {
      sourceIds,
    }));
  return (envelope.results ?? []).map((r) => ({
    sourceId: r.sourceId,
    previousBalance: r.previousBalance,
    newBalance: r.newBalance,
    applied: r.applied,
  }));
}
