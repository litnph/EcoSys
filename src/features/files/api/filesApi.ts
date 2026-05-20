import type { ApiResponse } from "@/shared/types/api";
import { apiClient } from "@/shared/lib/axios";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";

import type { FileAttachment, SignedFileUrl } from "../types";

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

interface RemoteFileDto {
  id: string;
  moduleCode: string;
  entityType: string;
  entityId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  isPublic: boolean;
  createdAtUtc: string;
  signedUrl?: string;
}

interface RemoteSignedUrlDto {
  url: string;
  expiresAtUtc: string;
}

function mapFile(row: RemoteFileDto): FileAttachment {
  return {
    id: row.id,
    moduleCode: row.moduleCode,
    entityType: row.entityType,
    entityId: row.entityId,
    fileName: row.fileName,
    mimeType: row.mimeType,
    fileSize: row.fileSize,
    isPublic: row.isPublic,
    createdAtUtc: row.createdAtUtc,
    signedUrl: row.signedUrl,
  };
}

export async function uploadFile(params: {
  moduleCode: string;
  entityType: string;
  entityId: string;
  file: File;
}): Promise<FileAttachment> {
  const fd = new FormData();
  fd.append("module_code", params.moduleCode);
  fd.append("entity_type", params.entityType);
  fd.append("entity_id", params.entityId);
  fd.append("file", params.file);
  const row = await unwrap<RemoteFileDto>(
    apiClient.post("/files/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    }));
  return mapFile(row);
}

export async function getFileUrl(id: string): Promise<SignedFileUrl> {
  const row = await unwrap<RemoteSignedUrlDto>(
    apiClient.get(`/files/${id}/url`));
  return { url: row.url, expiresAtUtc: row.expiresAtUtc };
}

export async function deleteFile(id: string): Promise<void> {
  await unwrap<{ id: string }>(apiClient.delete(`/files/${id}`));
}
