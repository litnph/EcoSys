import type { ApiResponse } from "@/shared/types/api";
import { apiClient } from "@/shared/lib/axios";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";

import type { AutomationRule } from "../types";

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

function mapRule(row: Record<string, unknown>): AutomationRule {
  return {
    id: String(row.id),
    smoduleId: String(row.smoduleId),
    name: String(row.name),
    triggerType: String(row.triggerType),
    isActive: Boolean(row.isActive),
    lastRunStatus: row.lastRunStatus != null ? String(row.lastRunStatus) : null,
    lastRunAt: row.lastRunAt != null ? String(row.lastRunAt) : null,
  };
}

export async function getAutomationRules(
  smoduleId: string,
): Promise<AutomationRule[]> {
  const qs = new URLSearchParams({ smodule_id: smoduleId });
  const envelope = await unwrap<{ items: Record<string, unknown>[] }>(
    apiClient.get(`/automation/rules?${qs.toString()}`),
  );
  return envelope.items.map(mapRule);
}

export async function createAutomationRule(
  body: Record<string, unknown>,
): Promise<AutomationRule> {
  const envelope = await unwrap<{ rule?: Record<string, unknown> } & Record<string, unknown>>(
    apiClient.post("/automation/rules", body),
  );
  const row = envelope.rule ?? envelope;
  return mapRule(row as Record<string, unknown>);
}

export async function toggleAutomationRule(
  id: string,
): Promise<{ id: string; isActive: boolean }> {
  return unwrap<{ id: string; isActive: boolean }>(
    apiClient.post(`/automation/rules/${id}/toggle`),
  );
}

export async function deleteAutomationRule(id: string): Promise<void> {
  await unwrap<{ id: string }>(apiClient.delete(`/automation/rules/${id}`));
}
