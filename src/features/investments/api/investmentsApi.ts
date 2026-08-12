import type { ApiResponse } from "@/shared/types/api";
import { apiClient } from "@/shared/lib/axios";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";

import type { Investment } from "../types";

export interface CreateInvestmentRequest {
  name: string;
  type: "stock" | "fund" | "realEstate" | "crypto" | "other";
  currency?: string | null;
  note?: string | null;
}

export interface UpdateInvestmentRequest {
  name: string;
  type: CreateInvestmentRequest["type"];
  currentValue: number;
  currency: string;
  note?: string | null;
}

interface RemoteInvestmentDto {
  id: string;
  name: string;
  type: string;
  currentValue: number;
  totalInvested: number;
  totalReturned: number;
  currency: string;
  note: string | null;
  profitLoss: number;
  profitLossFormulaVersion: string;
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

function mapInvestment(row: RemoteInvestmentDto): Investment {
  return {
    id: String(row.id),    name: String(row.name),
    type: String(row.type),
    currentValue: Number(row.currentValue ?? 0),
    totalInvested: Number(row.totalInvested ?? 0),
    totalReturned: Number(row.totalReturned ?? 0),
    currency: String(row.currency ?? "VND"),
    note: row.note != null ? String(row.note) : null,
    profitLoss: Number(row.profitLoss ?? 0),
    profitLossFormulaVersion: String(
      row.profitLossFormulaVersion ?? "legacy-unversioned",
    ),
  };
}

export async function getInvestments(): Promise<Investment[]> {
  const envelope = await unwrap<{ items: RemoteInvestmentDto[] }>(
    apiClient.get("/finance/investments"));
  return envelope.items.map(mapInvestment);
}

export async function createInvestment(
  body: CreateInvestmentRequest): Promise<Investment> {
  const envelope = await unwrap<{ investment: RemoteInvestmentDto }>(
    apiClient.post("/finance/investments", body));
  return mapInvestment(envelope.investment);
}

export async function updateInvestment(
  id: string,
  body: UpdateInvestmentRequest): Promise<Investment> {
  const envelope = await unwrap<{ investment: RemoteInvestmentDto }>(
    apiClient.put(`/finance/investments/${id}`, body));
  return mapInvestment(envelope.investment);
}

export async function deleteInvestment(id: string): Promise<void> {
  await unwrap<{ id: string }>(apiClient.delete(`/finance/investments/${id}`));
}
