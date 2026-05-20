import type { ApiResponse } from "@/shared/types/api";
import { apiClient } from "@/shared/lib/axios";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";

import type { Investment } from "../types";

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

function mapInvestment(row: Record<string, unknown>): Investment {
  return {
    id: String(row.id),
    smoduleId: String(row.smoduleId),
    name: String(row.name),
    type: String(row.type),
    currentValue: Number(row.currentValue ?? 0),
    totalInvested: Number(row.totalInvested ?? 0),
    totalReturned: Number(row.totalReturned ?? 0),
    currency: String(row.currency ?? "VND"),
    note: row.note != null ? String(row.note) : null,
    profitLoss: Number(row.profitLoss ?? 0),
  };
}

export async function getInvestments(smoduleId: string): Promise<Investment[]> {
  const qs = new URLSearchParams({ smodule_id: smoduleId });
  const envelope = await unwrap<{ items: Record<string, unknown>[] }>(
    apiClient.get(`/finance/investments?${qs.toString()}`),
  );
  return envelope.items.map(mapInvestment);
}

export async function createInvestment(
  body: Record<string, unknown>,
): Promise<Investment> {
  const envelope = await unwrap<{ investment: Record<string, unknown> }>(
    apiClient.post("/finance/investments", body),
  );
  return mapInvestment(envelope.investment);
}

export async function updateInvestment(
  id: string,
  body: Record<string, unknown>,
): Promise<Investment> {
  const envelope = await unwrap<{ investment: Record<string, unknown> }>(
    apiClient.put(`/finance/investments/${id}`, body),
  );
  return mapInvestment(envelope.investment);
}

export async function deleteInvestment(id: string): Promise<void> {
  await unwrap<{ id: string }>(apiClient.delete(`/finance/investments/${id}`));
}
