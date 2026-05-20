import type { ApiResponse } from "@/shared/types/api";
import { apiClient } from "@/shared/lib/axios";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";

import { FINANCE_MODULE_CODE, type Space, type SpaceModule } from "../types";

interface RemoteSpaceTreeNodeDto {
  id: string;
  orgId: string;
  name: string;
  type: string;
  depth: number;
  path: string;
  financeModuleEnabled: boolean;
  sortOrder: number;
  parentId: string | null;
  children: RemoteSpaceTreeNodeDto[];
}

interface GetSpaceTreeResponseDto {
  roots: RemoteSpaceTreeNodeDto[];
}

interface RemoteSpaceModuleDto {
  id: string;
  spaceId: string;
  moduleCode: string | number;
  isEnabled: boolean;
  settings?: string | null;
  enabledAt: string;
  disabledAt?: string | null;
}

interface GetSpaceModulesResponseDto {
  modules: RemoteSpaceModuleDto[];
}

interface ToggleSpaceModuleResponseDto {
  module: RemoteSpaceModuleDto;
}

function mapSpaceNode(row: RemoteSpaceTreeNodeDto): Space {
  return {
    id: row.id,
    orgId: row.orgId,
    parentId: row.parentId,
    name: row.name,
    type: row.type,
    depth: row.depth,
    path: row.path,
    financeModuleEnabled: row.financeModuleEnabled,
    sortOrder: row.sortOrder,
    children: Array.isArray(row.children) ? row.children.map(mapSpaceNode) : [],
  };
}

function normalizeModuleCode(code: string | number): string {
  if (typeof code === "number") {
    return code === 1 ? FINANCE_MODULE_CODE : String(code);
  }
  return code.toLowerCase();
}

function parseSettings(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

function mapModule(row: RemoteSpaceModuleDto): SpaceModule {
  return {
    id: row.id,
    spaceId: row.spaceId,
    moduleCode: normalizeModuleCode(row.moduleCode),
    isEnabled: row.isEnabled,
    settings: parseSettings(row.settings),
    enabledAt: row.enabledAt,
    disabledAt: row.disabledAt ?? null,
  };
}

function assertSuccess<T>(body: ApiResponse<T>): asserts body is ApiResponse<T> & {
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

/** `GET /api/v1/spaces/tree?org_id={orgId}` */
export async function getSpaceTree(
  orgId: string,
): Promise<ApiResponse<Space[]>> {
  const qs = new URLSearchParams({ org_id: orgId });
  const { data: body } = await apiClient.get<ApiResponse<GetSpaceTreeResponseDto>>(
    `/spaces/tree?${qs.toString()}`,
  );
  assertSuccess(body);
  return { success: true, data: body.data.roots.map(mapSpaceNode), meta: body.meta };
}

/** `GET /api/v1/spaces/{spaceId}/modules` */
export async function getSpaceModules(
  spaceId: string,
): Promise<ApiResponse<SpaceModule[]>> {
  const { data: body } = await apiClient.get<
    ApiResponse<GetSpaceModulesResponseDto>
  >(`/spaces/${spaceId}/modules`);
  assertSuccess(body);
  return { success: true, data: body.data.modules.map(mapModule), meta: body.meta };
}

/**
 * `PUT /api/v1/spaces/{spaceId}/modules/{moduleCode}` với body `{ enable: true }`.
 *
 * BE thực hiện idempotent enable/disable. Trả về một row `SPACE_MODULES`.
 */
export async function enableModule(
  spaceId: string,
  moduleCode: string,
): Promise<ApiResponse<SpaceModule>> {
  const { data: body } = await apiClient.put<
    ApiResponse<ToggleSpaceModuleResponseDto>
  >(`/spaces/${spaceId}/modules/${moduleCode}`, { enable: true });
  assertSuccess(body);
  return { success: true, data: mapModule(body.data.module), meta: body.meta };
}

/** Tìm space đầu tiên đã enable finance (DFS theo `sortOrder`). */
export function findFirstFinanceSpace(nodes: Space[]): Space | null {
  for (const node of nodes) {
    if (node.financeModuleEnabled) return node;
    const child = node.children ? findFirstFinanceSpace(node.children) : null;
    if (child) return child;
  }
  return null;
}

/** Lấy smoduleId của module finance đang enable, hoặc null nếu không có. */
export function resolveFinanceSmoduleId(modules: SpaceModule[]): string | null {
  const finance = modules.find(
    (m) => m.isEnabled && m.moduleCode === FINANCE_MODULE_CODE,
  );
  return finance?.id ?? null;
}
