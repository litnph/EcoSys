import type { ApiResponse } from "@/shared/types/api";
import { apiClient } from "@/shared/lib/axios";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";

import type { DataExportStatus } from "../types";

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

function mapExport(row: Record<string, unknown>): DataExportStatus {
  return {
    id: String(row.id),
    status: String(row.status),
    downloadUrl: row.downloadUrl != null ? String(row.downloadUrl) : null,
    sizeBytes: row.sizeBytes != null ? Number(row.sizeBytes) : null,
    expiresAt: row.expiresAt != null ? String(row.expiresAt) : null,
    processedAt: row.processedAt != null ? String(row.processedAt) : null,
    readyAt: row.readyAt != null ? String(row.readyAt) : null,
    errorMessage: row.errorMessage != null ? String(row.errorMessage) : null,
  };
}

export async function requestDataExport(): Promise<string> {
  const envelope = await unwrap<{ exportId: string }>(
    apiClient.post("/user/data-export"),
  );
  return envelope.exportId;
}

export async function getDataExportStatus(id: string): Promise<DataExportStatus> {
  const row = await unwrap<Record<string, unknown>>(
    apiClient.get(`/user/data-export/${id}`),
  );
  return mapExport(row);
}

export async function requestAccountDeletion(reason?: string): Promise<string> {
  const envelope = await unwrap<{ requestId: string }>(
    apiClient.post("/user/deletion-request", { reason: reason ?? null }),
  );
  return envelope.requestId;
}

export async function cancelAccountDeletion(): Promise<void> {
  await unwrap<{ cancelled: boolean }>(
    apiClient.post("/user/deletion-request/cancel"),
  );
}
