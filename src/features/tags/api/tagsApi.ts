import type { ApiResponse } from "@/shared/types/api";
import { apiClient } from "@/shared/lib/axios";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";

import type { Tag } from "../types";

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

function mapTag(row: Record<string, unknown>): Tag {
  return {
    id: String(row.id),
    smoduleId: String(row.smoduleId),
    name: String(row.name),
    color: String(row.color ?? "#6366f1"),
    usageCount: Number(row.usageCount ?? 0),
  };
}

export async function getTags(smoduleId: string): Promise<Tag[]> {
  const qs = new URLSearchParams({ smodule_id: smoduleId });
  const rows = await unwrap<Record<string, unknown>[]>(
    apiClient.get(`/finance/tags?${qs.toString()}`),
  );
  return rows.map(mapTag);
}

export async function createTag(body: {
  smoduleId: string;
  name: string;
  color: string;
}): Promise<string> {
  const envelope = await unwrap<{ id: string }>(
    apiClient.post("/finance/tags", body),
  );
  return envelope.id;
}

export async function updateTag(
  id: string,
  body: { name: string; color: string },
): Promise<Tag> {
  const envelope = await unwrap<{ tag: Record<string, unknown> }>(
    apiClient.put(`/finance/tags/${id}`, body),
  );
  return mapTag(envelope.tag);
}

export async function deleteTag(id: string): Promise<void> {
  await unwrap<{ id: string }>(apiClient.delete(`/finance/tags/${id}`));
}
