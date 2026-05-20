import type { ApiResponse } from "@/shared/types/api";
import { apiClient } from "@/shared/lib/axios";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";

import type {
  InstallmentPayLineStatus,
  InstallmentPlan,
  InstallmentPlanListItem,
  InstallmentStatus,
  ConversionFeeStatus,
  CreateInstallmentPlanPayload,
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

interface RemotePayDto {
  installmentNumber: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: InstallmentPayLineStatus;
  paidAt?: string | null;
  txnId?: string | null;
}

interface RemotePlanDetailDto {
  id: string;  sourceId: string;
  sourceName?: string | null;
  originalTxnId: string;
  originalTxnDescription?: string | null;
  totalAmount: number;
  totalMonths: number;
  monthlyAmount: number;
  interestRate: number;
  conversionFeeRate?: number | null;
  conversionFeeAmount?: number | null;
  conversionFeeStatus?: ConversionFeeStatus | null;
  conversionFeeTxnId?: string | null;
  startDate: string;
  status: InstallmentStatus;
  cancellationReason?: string | null;
  pays?: RemotePayDto[] | null;
}

interface RemoteDetailEnvelope {
  plan: RemotePlanDetailDto;
}

interface RemoteListItemDto {
  id: string;  sourceId: string;
  sourceName?: string | null;
  originalTxnDescription?: string | null;
  status: InstallmentStatus;
  paidInstallments: number;
  totalInstallments: number;
  remainingAmount: number;
  createdAt: string;
}

interface RemoteListEnvelope {
  items: RemoteListItemDto[] | null;
}

function mapPay(
  row: RemotePayDto,
  planId: string): InstallmentPlan["pays"][number] {
  return {
    id: `${planId}-${String(row.installmentNumber)}`,
    planId,
    installmentNumber: row.installmentNumber,
    dueDate: row.dueDate,
    amount: Number(row.amount),
    paidAmount: Number(row.paidAmount),
    status: row.status,
    paidAt: row.paidAt ?? null,
    linkedTxnId: row.txnId ?? null,
  };
}

function mapPlan(dto: RemotePlanDetailDto): InstallmentPlan {
  const pays = (dto.pays ?? []).map((p) => mapPay(p, dto.id));
  return {
    id: dto.id,    sourceId: dto.sourceId,
    sourceName: dto.sourceName ?? null,
    originalTxnId: dto.originalTxnId,
    originalTxnDescription: dto.originalTxnDescription ?? null,
    totalAmount: Number(dto.totalAmount),
    totalMonths: dto.totalMonths,
    monthlyAmount: Number(dto.monthlyAmount),
    interestRate: Number(dto.interestRate),
    conversionFeeRate:
      dto.conversionFeeRate === null || dto.conversionFeeRate === undefined
        ? null
        : Number(dto.conversionFeeRate),
    conversionFeeAmount:
      dto.conversionFeeAmount === null ||
      dto.conversionFeeAmount === undefined
        ? null
        : Number(dto.conversionFeeAmount),
    conversionFeeStatus: dto.conversionFeeStatus ?? null,
    conversionFeeTxnId: dto.conversionFeeTxnId ?? null,
    startDate: dto.startDate,
    status: dto.status,
    cancellationReason: dto.cancellationReason ?? null,
    pays,
  };
}

function mapListItem(row: RemoteListItemDto): InstallmentPlanListItem {
  return {
    id: row.id,    sourceId: row.sourceId,
    sourceName: row.sourceName ?? null,
    originalTxnDescription: row.originalTxnDescription ?? null,
    status: row.status,
    paidInstallments: row.paidInstallments,
    totalInstallments: row.totalInstallments,
    remainingAmount: Number(row.remainingAmount),
    createdAt: row.createdAt,
  };
}

export async function getInstallmentPlans(
  status?: InstallmentStatus): Promise<InstallmentPlanListItem[]> {
  const qs = new URLSearchParams();
  if (status) qs.set("status", status);
  const envelope = await unwrap<RemoteListEnvelope>(
    apiClient.get("/finance/installment-plans"));
  return (envelope.items ?? []).map(mapListItem);
}

export async function getInstallmentPlanDetail(id: string): Promise<InstallmentPlan> {
  const envelope = await unwrap<RemoteDetailEnvelope>(
    apiClient.get(`/finance/installment-plans/${id}`));
  return mapPlan(envelope.plan);
}

export async function createInstallmentPlan(
  data: CreateInstallmentPlanPayload): Promise<{ planId: string }> {
  const envelope = await unwrap<{ planId: string }>(
    apiClient.post(`/finance/installment-plans`, {
      originalTxnId: data.originalTxnId,
      totalMonths: data.totalMonths,
      interestRate: data.interestRate,
      conversionFeeRate: data.conversionFeeRate,
    }));
  return envelope;
}

export async function cancelInstallmentPlan(
  id: string,
  reason?: string): Promise<void> {
  const { data: body } = await apiClient.post<
    ApiEnvelope<Record<string, never>>
  >(`/finance/installment-plans/${id}/cancel`, { reason: reason ?? null });
  assertData(body);
}

export async function recordInstallmentPayment(
  planId: string,
  installmentNumber: number,
  paymentSourceId: string): Promise<{ transactionId: string }> {
  const envelope = await unwrap<{ transactionId: string }>(
    apiClient.post(
      `/finance/installment-plans/${planId}/pays/${String(installmentNumber)}/payment`,
      { paymentSourceId }));
  return envelope;
}
