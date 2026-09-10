import { apiClient } from "@/shared/lib/axios";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";
import type { ApiResponse } from "@/shared/types/api";

import type { ClassificationMatch, ClassificationRule, ClassificationRuleInput } from "../types";

function dataOf<T>(body: ApiResponse<T>): T {
  if (!body.success || body.data == null) throw new Error(getFailureMessageFromApiBody(body));
  return body.data;
}

const path = "/finance/transaction-classification-rules";

export async function getClassificationRules(): Promise<ClassificationRule[]> {
  const { data } = await apiClient.get<ApiResponse<ClassificationRule[]>>(path);
  return dataOf(data);
}

export async function createClassificationRule(input: ClassificationRuleInput): Promise<ClassificationRule> {
  const { data } = await apiClient.post<ApiResponse<ClassificationRule>>(path, input);
  return dataOf(data);
}

export async function updateClassificationRule(
  id: string,
  input: ClassificationRuleInput,
): Promise<ClassificationRule> {
  const { data } = await apiClient.put<ApiResponse<ClassificationRule>>(`${path}/${id}`, input);
  return dataOf(data);
}

export async function deleteClassificationRule(id: string): Promise<void> {
  const { data } = await apiClient.delete<ApiResponse<unknown>>(`${path}/${id}`);
  dataOf(data);
}

export async function matchTransactionContents(
  items: Array<{ key: string; content: string | null }>,
): Promise<ClassificationMatch[]> {
  const { data } = await apiClient.post<ApiResponse<ClassificationMatch[]>>(`${path}/match`, { items });
  return dataOf(data);
}
