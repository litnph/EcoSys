import type { ApiResponse } from "@/shared/types/api";
import { apiClient } from "@/shared/lib/axios";
import { toApiWholeAmount } from "@/shared/lib/currencyUnits";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";

import type { Saving, SavingDetail } from "../types";

export interface CreateSavingRequest {
  sourceId: string;
  name: string;
  targetAmount?: number | null;
  interestRate: number;
  startDate: string;
  maturityDate?: string | null;
  type: "flexible" | "fixedTerm";
  status: "active" | "matured" | "withdrawn";
  note?: string | null;
}

export type UpdateSavingRequest = CreateSavingRequest;

interface RemoteSavingDto {
  id: string;
  sourceId: string;
  sourceName: string;
  name: string;
  targetAmount: number | null;
  currentAmount: number;
  interestRate: number;
  startDate: string;
  maturityDate: string | null;
  type: string;
  status: string;
  note: string | null;
}

type ApiEnvelope<T> = ApiResponse<T>;

function assertData<T>(body: ApiEnvelope<T>): asserts body is ApiEnvelope<T> & {
  success: true;
  data: T;
} {
  if (!body.success) throw new Error(getFailureMessageFromApiBody(body));
  if (body.data === null || body.data === undefined) {
    throw new Error("Phản hồi API không hợp lệ");
  }
}

async function unwrap<T>(getter: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const { data: body } = await getter;
  assertData(body);
  return body.data;
}

function mapSaving(row: RemoteSavingDto): Saving {
  return {
    id: String(row.id),    sourceId: String(row.sourceId),
    sourceName: String(row.sourceName ?? ""),
    name: String(row.name),
    targetAmount: row.targetAmount != null ? Number(row.targetAmount) : null,
    currentAmount: Number(row.currentAmount ?? 0),
    interestRate: Number(row.interestRate ?? 0),
    startDate: String(row.startDate),
    maturityDate: row.maturityDate != null ? String(row.maturityDate) : null,
    type: String(row.type),
    status: String(row.status),
    note: row.note != null ? String(row.note) : null,
  };
}

export async function getSavings(): Promise<Saving[]> {
  const envelope = await unwrap<{ items: RemoteSavingDto[] }>(
    apiClient.get("/finance/savings"));
  return envelope.items.map(mapSaving);
}

export async function getSavingById(id: string): Promise<SavingDetail> {
  const envelope = await unwrap<{ saving: RemoteSavingDto }>(
    apiClient.get(`/finance/savings/${id}`));
  return mapSaving(envelope.saving) as SavingDetail;
}

export async function createSaving(body: CreateSavingRequest): Promise<Saving> {
  const envelope = await unwrap<{ saving: RemoteSavingDto }>(
    apiClient.post("/finance/savings", {
      ...body,
      targetAmount:
        body.targetAmount == null ? null : toApiWholeAmount(body.targetAmount),
    }));
  return mapSaving(envelope.saving);
}

export async function updateSaving(
  id: string,
  body: UpdateSavingRequest): Promise<Saving> {
  const envelope = await unwrap<{ saving: RemoteSavingDto }>(
    apiClient.put(`/finance/savings/${id}`, {
      ...body,
      targetAmount:
        body.targetAmount == null ? null : toApiWholeAmount(body.targetAmount),
    }));
  return mapSaving(envelope.saving);
}

export async function deleteSaving(id: string): Promise<void> {
  await unwrap<{ id: string }>(apiClient.delete(`/finance/savings/${id}`));
}

export async function depositToSaving(
  id: string,
  body: { amount: number; txnDate: string; note?: string | null }): Promise<void> {
  await unwrap<unknown>(apiClient.post(`/finance/savings/${id}/deposit`, {
    ...body,
    amount: toApiWholeAmount(body.amount),
  }));
}

export async function withdrawFromSaving(
  id: string,
  body: { amount: number; txnDate: string; note?: string | null }): Promise<void> {
  await unwrap<unknown>(apiClient.post(`/finance/savings/${id}/withdraw`, {
    ...body,
    amount: toApiWholeAmount(body.amount),
  }));
}
