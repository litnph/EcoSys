import type { ApiResponse } from "@/shared/types/api";
import { apiClient } from "@/shared/lib/axios";
import { toApiWholeAmountOrNull } from "@/shared/lib/currencyUnits";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";

import type {
  CreateSourceRequest,
  FinSource,
  FinSourceType,
  UpdateSourceRequest,
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

interface RemoteFinSourceDto {
  id: string;
  name: string;
  type: FinSourceType;
  balance: number;
  currency: string;
  creditLimit?: number | null;
  statementDay?: number | null;
  paymentDueDay?: number | null;
  minInstallmentAmt?: number | null;
  icon?: string | null;
  color?: string | null;
  sortOrder: number;
  installmentRemainingAmount?: number;
}

interface SourcesListEnvelope {
  sources: RemoteFinSourceDto[];
}

interface SourceOneEnvelope {
  source: RemoteFinSourceDto;
}

interface DeleteSourceEnvelope {
  id: string;
}

function mapRemoteSource(row: RemoteFinSourceDto): FinSource {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    balance: row.balance,
    currency: row.currency,
    creditLimit:
      typeof row.creditLimit === "number" ? row.creditLimit : null,
    statementDay:
      typeof row.statementDay === "number" ? row.statementDay : null,
    paymentDueDay:
      typeof row.paymentDueDay === "number" ? row.paymentDueDay : null,
    minInstallmentAmt:
      typeof row.minInstallmentAmt === "number"
        ? row.minInstallmentAmt
        : null,
    icon: row.icon ?? null,
    color: row.color ?? null,
    sortOrder: row.sortOrder,
    installmentRemainingAmount: row.installmentRemainingAmount ?? 0,
  };
}

function buildCreateBody(data: CreateSourceRequest) {
  const isCard = data.type === "creditCard";
  return {
    name: data.name,
    type: data.type,
    currency: data.currency ?? "VND",
    icon: data.icon ?? null,
    color: data.color ?? null,
    sortOrder: data.sortOrder ?? null,
    creditLimit: isCard
      ? toApiWholeAmountOrNull(data.creditLimit ?? null)
      : null,
    statementDay: isCard ? data.statementDay ?? null : null,
    paymentDueDay: isCard ? data.paymentDueDay ?? null : null,
    minInstallmentAmt: isCard
      ? toApiWholeAmountOrNull(data.minInstallmentAmt ?? null)
      : null,
    initialBalance: isCard
      ? null
      : toApiWholeAmountOrNull(data.initialBalance ?? null),
  };
}

function buildUpdateBody(data: UpdateSourceRequest) {
  const isCard = data.type === "creditCard";
  return {
    name: data.name,
    type: data.type,
    currency: data.currency ?? "VND",
    icon: data.icon ?? null,
    color: data.color ?? null,
    sortOrder: data.sortOrder ?? null,
    creditLimit: isCard
      ? toApiWholeAmountOrNull(data.creditLimit ?? null)
      : null,
    statementDay: isCard ? data.statementDay ?? null : null,
    paymentDueDay: isCard ? data.paymentDueDay ?? null : null,
    minInstallmentAmt: isCard
      ? toApiWholeAmountOrNull(data.minInstallmentAmt ?? null)
      : null,
  };
}

export async function getSources(): Promise<FinSource[]> {
  const envelope = await unwrap<SourcesListEnvelope>(
    apiClient.get("/finance/sources"));
  return envelope.sources.map(mapRemoteSource);
}

export async function getSourceById(id: string): Promise<FinSource> {
  const envelope = await unwrap<SourceOneEnvelope>(
    apiClient.get(`/finance/sources/${id}`));
  return mapRemoteSource(envelope.source);
}

export async function createSource(data: CreateSourceRequest): Promise<FinSource> {
  const envelope = await unwrap<SourceOneEnvelope>(
    apiClient.post(`/finance/sources`, buildCreateBody(data)));
  return mapRemoteSource(envelope.source);
}

export async function updateSource(
  id: string,
  data: UpdateSourceRequest): Promise<FinSource> {
  const envelope = await unwrap<SourceOneEnvelope>(
    apiClient.put(`/finance/sources/${id}`, buildUpdateBody(data)));
  return mapRemoteSource(envelope.source);
}

export async function deleteSource(id: string): Promise<string> {
  const envelope = await unwrap<DeleteSourceEnvelope>(
    apiClient.delete(`/finance/sources/${id}`));
  return envelope.id;
}

interface TransactionsPageEnvelope {
  items: unknown[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/** Số giao dịch có <c>sourceId</c> là nguồn (khớp filter API list). */
export async function getSourceTransactionCount(
  sourceId: string): Promise<number> {
  const qs = new URLSearchParams({
    source_id: sourceId,
    page: "1",
    page_size: "1",
  });
  const envelope = await unwrap<TransactionsPageEnvelope>(
    apiClient.get(`/finance/transactions?${qs.toString()}`));
  return envelope.totalCount;
}
