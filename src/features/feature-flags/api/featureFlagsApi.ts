import type { ApiResponse } from "@/shared/types/api";
import { apiClient } from "@/shared/lib/axios";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";

import type { FeatureFlag } from "../types";

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

interface RemoteFlagDto {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  isEnabledGlobal: boolean;
  rolloutPercentage: number;
  isArchived: boolean;
  isEnabledForCurrentPrincipal: boolean;
}

function mapFlag(row: RemoteFlagDto): FeatureFlag {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description ?? null,
    isEnabledGlobal: row.isEnabledGlobal,
    rolloutPercentage: row.rolloutPercentage,
    isArchived: row.isArchived,
    isEnabledForCurrentPrincipal: row.isEnabledForCurrentPrincipal,
  };
}

export async function getFeatureFlags(): Promise<FeatureFlag[]> {
  const { data: body } = await apiClient.get<ApiEnvelope<RemoteFlagDto[]>>(
    "/feature-flags");
  assertData(body);
  return body.data.map(mapFlag);
}
