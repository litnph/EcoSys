import type { ApiResponse } from "@/shared/types/api";
import { apiClient } from "@/shared/lib/axios";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";

import type { Organization } from "../types";

interface RemoteOrgListItemDto {
  id: string;
  slug: string;
  name: string;
  isPersonal: boolean;
  defaultCurrency: string;
  myRole: string;
  memberCount: number;
  createdAt: string;
}

interface GetMyOrgsResponseDto {
  items: RemoteOrgListItemDto[];
}

function mapOrg(row: RemoteOrgListItemDto): Organization {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    isPersonal: row.isPersonal,
    defaultCurrency: row.defaultCurrency,
    myRole: row.myRole,
    memberCount: row.memberCount,
    createdAt: row.createdAt,
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

/**
 * `GET /api/v1/organizations`
 *
 * Trả về danh sách tổ chức mà caller đang là thành viên (bao gồm Personal Org).
 * BE đã sort: Personal đứng đầu, sau đó theo `name` asc.
 */
export async function getMyOrganizations(): Promise<ApiResponse<Organization[]>> {
  const { data: body } = await apiClient.get<ApiResponse<GetMyOrgsResponseDto>>(
    "/organizations",
  );
  assertSuccess(body);
  return {
    success: true,
    data: body.data.items.map(mapOrg),
    meta: body.meta,
  };
}

interface RemoteOrganizationDetailDto {
  id: string;
  slug: string;
  name: string;
  isPersonal: boolean;
  ownerId: string;
  defaultCurrency: string;
  description?: string | null;
  myRole: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CreateOrganizationRequest {
  name: string;
  slug: string;
  defaultCurrency?: string;
  description?: string;
}

/** `POST /api/v1/organizations` */
export async function createOrganization(
  payload: CreateOrganizationRequest,
): Promise<ApiResponse<Organization>> {
  const { data: body } = await apiClient.post<
    ApiResponse<{ organization: RemoteOrganizationDetailDto }>
  >("/organizations", payload);
  assertSuccess(body);
  const row = body.data.organization;
  return {
    success: true,
    data: {
      id: row.id,
      slug: row.slug,
      name: row.name,
      isPersonal: row.isPersonal,
      defaultCurrency: row.defaultCurrency,
      ownerId: row.ownerId,
      myRole: row.myRole,
      memberCount: row.memberCount,
      createdAt: row.createdAt,
    },
    meta: body.meta,
  };
}

/** `GET /api/v1/organizations/{id}` */
export async function getOrganizationById(
  orgId: string,
): Promise<ApiResponse<Organization>> {
  const { data: body } = await apiClient.get<
    ApiResponse<{ organization: RemoteOrganizationDetailDto }>
  >(`/organizations/${orgId}`);
  assertSuccess(body);
  const row = body.data.organization;
  return {
    success: true,
    data: {
      id: row.id,
      slug: row.slug,
      name: row.name,
      isPersonal: row.isPersonal,
      defaultCurrency: row.defaultCurrency,
      ownerId: row.ownerId,
      myRole: row.myRole,
      memberCount: row.memberCount,
      createdAt: row.createdAt,
    },
    meta: body.meta,
  };
}
