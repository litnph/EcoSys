import {
  IMAGE_IMPORT_KINDS,
  type ImageImportTypeSetting,
} from "@/features/transactions/imageImport/types";
import { apiClient } from "@/shared/lib/axios";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";
import type { ApiResponse } from "@/shared/types/api";

type RawImageImportTypeSetting = {
  type?: string | null;
  displayName?: string | null;
  sourceId?: string | null;
};

const path = "/settings/image-import-types";

function dataOf<T>(body: ApiResponse<T>): T {
  if (!body.success || body.data == null) {
    throw new Error(getFailureMessageFromApiBody(body));
  }
  return body.data;
}

function normalizeSettings(
  raw: readonly RawImageImportTypeSetting[] | null | undefined,
): ImageImportTypeSetting[] {
  const supported = new Set<string>(IMAGE_IMPORT_KINDS);
  const seen = new Set<string>();
  const normalized: ImageImportTypeSetting[] = [];

  for (const setting of raw ?? []) {
    const type = setting.type?.trim().toLowerCase();
    const displayName = setting.displayName?.trim();
    if (!type || !supported.has(type) || !displayName || seen.has(type)) continue;
    seen.add(type);
    normalized.push({
      type: type as ImageImportTypeSetting["type"],
      displayName,
      sourceId: setting.sourceId?.trim() || null,
    });
  }

  return normalized;
}

export async function getImageImportTypeSettings(): Promise<ImageImportTypeSetting[]> {
  const { data } = await apiClient.get<ApiResponse<RawImageImportTypeSetting[]>>(path);
  return normalizeSettings(dataOf(data));
}

export async function updateImageImportTypeSettings(
  settings: ImageImportTypeSetting[],
): Promise<ImageImportTypeSetting[]> {
  const { data } = await apiClient.put<ApiResponse<RawImageImportTypeSetting[]>>(path, {
    settings,
  });
  return normalizeSettings(dataOf(data));
}
