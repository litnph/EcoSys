import type { ApiResponse, PaginationMeta } from "@/shared/types/api";
import { apiClient } from "@/shared/lib/axios";
import {
  toApiWholeAmount,
  toApiWholeAmountOrNull,
} from "@/shared/lib/currencyUnits";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";

import type {
  FinTransactionHistory,
  Transaction,
  TransactionAttachment,
  TransactionDetail,
  TransactionFilters,
  TransactionPurpose,
  TransactionType,
  TransactionsPage,
  TxnStatus,
} from "../types";
import { normalizeTxnType, normalizeTxnStatus } from "../utils/txnDisplay";

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

interface RemoteListItem {
  id: string;
  type: string;
  purpose?: string;
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
  hasInstallmentPlan?: boolean;
  isInstallmentPayment?: boolean;
  isOnBillingCycle?: boolean;
  billingCycleStatementMonth?: string | null;
  tags?: Array<{ id: string; name: string; color: string }>;
}

function normalizePurpose(raw?: string | null): TransactionPurpose {
  switch (raw) {
    case "statementPayment":
    case "installmentPayment":
    case "conversionFee":
    case "savingDeposit":
    case "savingWithdrawal":
    case "refund":
      return raw;
    default:
      return "general";
  }
}

interface RemoteListEnvelope {
  items: RemoteListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

function mapListItem(row: RemoteListItem): Transaction {
  return {
    id: row.id,
    type: normalizeTxnType(row.type),
    purpose: normalizePurpose(row.purpose),
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
    hasInstallmentPlan: row.hasInstallmentPlan ?? false,
    isInstallmentPayment: row.isInstallmentPayment ?? false,
    isOnBillingCycle: row.billingCycleStatementMonth != null,
    billingCycleStatementMonth: row.billingCycleStatementMonth ?? null,
    tags: (row.tags ?? []).map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
    })),
  };
}

interface RemoteDetailDto {
  id: string;
  type: string;
  purpose?: string;
  status: string;
  amount: number;
  currency: string;
  txnDate: string;
  sourceId: string;
  categoryId?: string | null;
  description: string;
  note?: string | null;
  monthlyPeriodId?: string | null;
  refTxnId?: string | null;
  savingId?: string | null;
  billingCycleId?: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  canEditAmount?: boolean;
  canDelete?: boolean;
  hasInstallmentPlan?: boolean;
  isInstallmentPayment?: boolean;
  source?: {
    id: string;
    name: string;
    currency: string;
    balance: number;
  } | null;
  category?: {
    id: string;
    name: string;
    kind: string;
  } | null;
  tags?: Array<{ id: string; name: string; color: string }>;
}

interface RemoteDetailEnvelope {
  transaction: RemoteDetailDto;
}

function mapDetailDto(t: RemoteDetailDto): TransactionDetail {
  return {
    id: t.id,
    type: normalizeTxnType(t.type),
    purpose: normalizePurpose(t.purpose),
    status: normalizeTxnStatus(t.status),
    amount: t.amount,
    currency: t.currency,
    sourceId: t.sourceId,
    sourceName: t.source?.name ?? "",
    categoryId: t.categoryId,
    categoryName: t.category?.name ?? null,
    txnDate: t.txnDate,
    note: t.note,
    description: t.description,
    refTxnId: t.refTxnId ?? null,
    savingId: t.savingId ?? null,
    billingCycleId: t.billingCycleId ?? null,
    monthlyPeriodId: t.monthlyPeriodId ?? null,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    version: t.version,
    canEditAmount: t.canEditAmount ?? true,
    canDelete: t.canDelete ?? true,
    hasInstallmentPlan: t.hasInstallmentPlan ?? false,
    isInstallmentPayment: t.isInstallmentPayment ?? false,
    source: t.source
      ? {
          id: t.source.id,
          name: t.source.name,
          currency: t.source.currency,
          balance: t.source.balance,
        }
      : null,
    category: t.category
      ? {
          id: t.category.id,
          name: t.category.name,
          kind: t.category.kind,
        }
      : null,
    tags: (t.tags ?? []).map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
    })),
  };
}

interface RemoteHistoryItem {
  id: string;
  transactionId: string;
  version: number;
  changedBy?: string | null;
  sessionId?: string | null;
  changeType: string;
  changedFields?: string | null;
  snapshot?: string | null;
  changeReason?: string | null;
  createdAt: string;
}

interface RemoteHistoryEnvelope {
  items: RemoteHistoryItem[];
}

function mapHistoryChangeType(raw: string): FinTransactionHistory["changeType"] {
  const m: Record<string, FinTransactionHistory["changeType"]> = {
    created: "created",
    updated: "updated",
    deleted: "deleted",
    restored: "restored",
    cancelled: "cancelled",
  };
  return m[raw] ?? "updated";
}

interface RemoteAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  isPublic: boolean;
  uploadedAtUtc: string;
  uploadedBy: string;
}

interface RemoteAttachmentsEnvelope {
  items: RemoteAttachment[];
}

function buildQueryParams(filters: TransactionFilters): URLSearchParams {
  const qs = new URLSearchParams({
    page: String(filters.page),
    page_size: String(filters.pageSize),
  });
  if (filters.sourceId) qs.set("source_id", filters.sourceId);
  if (filters.type) qs.set("type", serializeTypeForQuery(filters.type));
  if (filters.categoryId) qs.set("category_id", filters.categoryId);
  if (filters.dateFrom) qs.set("date_from", filters.dateFrom);
  if (filters.dateTo) qs.set("date_to", filters.dateTo);
  if (typeof filters.amountMin === "number")
    qs.set("amount_min", String(toApiWholeAmount(filters.amountMin)));
  if (typeof filters.amountMax === "number")
    qs.set("amount_max", String(toApiWholeAmount(filters.amountMax)));
  if (filters.status) qs.set("status", serializeStatusForQuery(filters.status));
  return qs;
}

function serializeStatusForQuery(status: TxnStatus): string {
  const map: Record<TxnStatus, string> = {
    new: "new",
    transferredToInstallment: "transferredToInstallment",
    completed: "completed",
    cancelled: "cancelled",
  };
  return map[status];
}

function paginationFromResponse(
  envelope: RemoteListEnvelope,
  meta?: PaginationMeta | null): Pick<TransactionsPage, "page" | "pageSize" | "totalCount" | "totalPages"> {
  if (meta) {
    return {
      page: meta.page,
      pageSize: meta.pageSize,
      totalCount: meta.totalCount,
      totalPages: meta.totalPages,
    };
  }
  return {
    page: envelope.page,
    pageSize: envelope.pageSize,
    totalCount: envelope.totalCount,
    totalPages: envelope.totalPages,
  };
}

/** Backend nhận giá trị enum .NET (camelCase) trên query, ví dụ debtBorrow. */
function serializeTypeForQuery(t: TransactionType): string {
  const toApi: Record<TransactionType, string> = {
    direct: "direct",
    deferred: "deferred",
    income: "income",
    transfer: "transfer",
    split: "split",
    debt_borrow: "debtBorrow",
    debt_repay: "debtRepay",
    loan_give: "loanGive",
    loan_collect: "loanCollect",
    reversal: "reversal",
    balance_adjustment: "balanceAdjustment",
  };
  return toApi[t];
}

export async function getTransactions(
  filters: TransactionFilters): Promise<TransactionsPage> {
  const qs = buildQueryParams(filters);
  const { data: body } = await apiClient.get<ApiEnvelope<RemoteListEnvelope>>(
    `/finance/transactions${qs.toString() ? `?${qs.toString()}` : ''}`);
  assertData(body);
  const envelope = body.data;
  const paging = paginationFromResponse(envelope, body.meta ?? null);
  return {
    items: envelope.items.map(mapListItem),
    ...paging,
  };
}

export async function getTransactionById(id: string): Promise<TransactionDetail> {
  const envelope = await unwrap<RemoteDetailEnvelope>(
    apiClient.get(`/finance/transactions/${id}`));
  return mapDetailDto(envelope.transaction);
}

export async function getTransactionHistory(
  id: string): Promise<FinTransactionHistory[]> {
  const envelope = await unwrap<RemoteHistoryEnvelope>(
    apiClient.get(`/finance/transactions/${id}/history`));
  return envelope.items.map((row) => ({
    id: row.id,
    transactionId: row.transactionId,
    version: row.version,
    changedBy: row.changedBy ?? null,
    sessionId: row.sessionId ?? null,
    changeType: mapHistoryChangeType(row.changeType),
    changedFields: row.changedFields ?? null,
    snapshot: row.snapshot ?? null,
    changeReason: row.changeReason ?? null,
    createdAt: row.createdAt,
  }));
}

export async function getTransactionAttachments(
  id: string): Promise<TransactionAttachment[]> {
  const envelope = await unwrap<RemoteAttachmentsEnvelope>(
    apiClient.get(`/finance/transactions/${id}/attachments`));
  return envelope.items.map((a) => ({
    id: a.id,
    fileName: a.fileName,
    mimeType: a.mimeType,
    fileSize: a.fileSize,
    isPublic: a.isPublic,
    uploadedAtUtc: a.uploadedAtUtc,
    uploadedBy: a.uploadedBy,
  }));
}

/** Giá trị `type` theo POST body (camelCase trong OpenAPI backend). */
export type CreateTransactionBodyType =
  | "direct"
  | "deferred"
  | "income"
  | "transfer"
  | "split"
  | "debtBorrow"
  | "debtRepay"
  | "loanGive"
  | "loanCollect"
  | "reversal";

export interface CreateSplitItemBody {
  personName: string | null;
  personContact?: string | null;
  amount: number;
}

export interface CreateTransactionBody {
  type: CreateTransactionBodyType;
  amount: number;
  sourceId: string;
  categoryId?: string | null;
  txnDate: string;
  description?: string | null;
  note?: string | null;
  monthlyPeriodId?: string | null;
  toSourceId?: string | null;
  personName?: string | null;
  personContact?: string | null;
  debtRecordId?: string | null;
  dueDate?: string | null;
  splits?: CreateSplitItemBody[] | null;
  clientRequestId?: string | null;
  expectedAggregateVersion?: number | null;
}

interface CreateTransactionEnvelope {
  transaction: RemoteDetailDto;
}

function serializeCreateTransactionBody(
  body: CreateTransactionBody): CreateTransactionBody {
  return {
    ...body,
    clientRequestId: body.clientRequestId ?? crypto.randomUUID(),
    amount: toApiWholeAmount(body.amount),
    splits: body.splits?.map((row) => ({
      ...row,
      amount: toApiWholeAmount(row.amount),
    })),
  };
}

export async function createTransaction(
  body: CreateTransactionBody): Promise<TransactionDetail> {
  const envelope = await unwrap<CreateTransactionEnvelope>(
    apiClient.post("/finance/transactions", serializeCreateTransactionBody(body)));
  return mapDetailDto(envelope.transaction);
}

export interface TransactionImportRowResult {
  index: number;
  success: boolean;
  transactionId: string | null;
  errorCode: string | null;
  message: string | null;
}

export interface TransactionImportPreview {
  isValid: boolean;
  validatedCount: number;
  rows: TransactionImportRowResult[];
}

export interface TransactionImportCommit {
  allowPartial: boolean;
  createdCount: number;
  failedCount: number;
  rows: TransactionImportRowResult[];
}

export async function previewTransactionImport(
  items: CreateTransactionBody[]): Promise<TransactionImportPreview> {
  return unwrap<TransactionImportPreview>(
    apiClient.post("/finance/transactions/import/preview", {
      items: items.map(serializeCreateTransactionBody),
    }));
}

export async function commitTransactionImport(
  items: CreateTransactionBody[],
  allowPartial = false): Promise<TransactionImportCommit> {
  return unwrap<TransactionImportCommit>(
    apiClient.post("/finance/transactions/import/commit", {
      items: items.map(serializeCreateTransactionBody),
      allowPartial,
    }));
}

export type UpdateTransactionPayload = {
  categoryId?: string | null;
  txnDate: string;
  description: string;
  note?: string | null;
  monthlyPeriodId?: string | null;
  amount?: number | null;
  expectedVersion?: number | null;
};

export async function updateTransaction(
  id: string,
  payload: UpdateTransactionPayload): Promise<TransactionDetail> {
  const { data: body } = await apiClient.put<ApiEnvelope<RemoteDetailEnvelope>>(
    `/finance/transactions/${id}`,
    {
      categoryId: payload.categoryId ?? null,
      txnDate: payload.txnDate,
      description: payload.description,
      note: payload.note ?? null,
      monthlyPeriodId: payload.monthlyPeriodId ?? null,
      amount: toApiWholeAmountOrNull(payload.amount),
      expectedVersion: payload.expectedVersion ?? null,
    });
  assertData(body);
  return mapDetailDto(body.data.transaction);
}

export async function deleteTransaction(
  id: string,
  reason?: string,
  expectedVersion?: number): Promise<string> {
  interface DelBody {
    transactionId?: string;
  }
  const { data: body } = await apiClient.delete<ApiEnvelope<DelBody>>(
    `/finance/transactions/${id}`,
    {
      data: {
        reason: reason ?? null,
        expectedVersion: expectedVersion ?? null,
      },
    });
  assertData(body);
  const tid = body.data.transactionId ?? id;
  return tid;
}
