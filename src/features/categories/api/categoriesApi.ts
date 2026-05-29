import type { ApiResponse } from "@/shared/types/api";
import { apiClient } from "@/shared/lib/axios";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";

import type {
  CategoryKind,
  CategoryNecessityLevel,
  FinCategory,
  FinCategoryFlat,
} from "../types";

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

interface RemoteCategoryTreeNodeDto {
  id: string;
  name: string;
  kind: CategoryKind;
  parentId: string | null;
  icon?: string | null;
  color?: string | null;
  sortOrder: number;
  isDefault: boolean;
  isSystem?: boolean;
  necessityLevel?: CategoryNecessityLevel | null;
  children: RemoteCategoryTreeNodeDto[];
}

interface RemoteCategoryFlatDto {
  id: string;
  name: string;
  kind: CategoryKind;
  parentId: string | null;
  icon?: string | null;
  color?: string | null;
  sortOrder: number;
  isDefault: boolean;
  isSystem?: boolean;
  necessityLevel?: CategoryNecessityLevel | null;
  depth: number;
}

interface GetCategoriesEnvelope {
  roots: RemoteCategoryTreeNodeDto[];
}

interface GetFlatCategoriesEnvelope {
  items: RemoteCategoryFlatDto[];
}

function mapTreeNode(row: RemoteCategoryTreeNodeDto): FinCategory {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    parentId: row.parentId,
    icon: row.icon ?? null,
    color: row.color ?? null,
    sortOrder: row.sortOrder,
    isDefault: row.isDefault,
    isSystem: row.isSystem ?? false,
    necessityLevel: row.necessityLevel ?? null,
    children:
      Array.isArray(row.children) && row.children.length > 0
        ? row.children.map(mapTreeNode)
        : undefined,
  };
}

function mapFlatRow(row: RemoteCategoryFlatDto): FinCategoryFlat {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    parentId: row.parentId,
    icon: row.icon ?? null,
    color: row.color ?? null,
    sortOrder: row.sortOrder,
    isDefault: row.isDefault,
    isSystem: row.isSystem ?? false,
    necessityLevel: row.necessityLevel ?? null,
    depth: row.depth,
  };
}

/** Danh mục dạng cây (roots + children lồng nhau). Backend yêu cầu `kind`. */
export async function getCategories(
  kind: CategoryKind): Promise<FinCategory[]> {
  const qs = new URLSearchParams({ kind });
  const envelope = await unwrap<GetCategoriesEnvelope>(
    apiClient.get(`/finance/categories?${qs.toString()}`));
  return envelope.roots.map(mapTreeNode);
}

/** Danh sách phẳng cho dropdown / autocomplete. */
export async function getFlatCategories(
  kind: CategoryKind): Promise<FinCategoryFlat[]> {
  const qs = new URLSearchParams({ kind });
  const envelope = await unwrap<GetFlatCategoriesEnvelope>(
    apiClient.get(`/finance/categories/flat?${qs.toString()}`));
  return envelope.items.map(mapFlatRow);
}

interface CategoryOneEnvelope {
  category: RemoteCategoryTreeNodeDto;
}

export interface CreateCategoryRequest {
  name: string;
  kind: CategoryKind;
  parentId?: string | null;
  icon?: string | null;
  color?: string | null;
  sortOrder?: number | null;
  isDefault?: boolean;
  necessityLevel?: CategoryNecessityLevel | null;
}

export interface UpdateCategoryRequest {
  name: string;
  kind: CategoryKind;
  parentId?: string | null;
  icon?: string | null;
  color?: string | null;
  sortOrder?: number | null;
  isDefault?: boolean;
  necessityLevel?: CategoryNecessityLevel | null;
}

export async function createCategory(
  data: CreateCategoryRequest): Promise<FinCategory> {
  const envelope = await unwrap<CategoryOneEnvelope>(
    apiClient.post("/finance/categories", {
      name: data.name,
      kind: data.kind,
      parentId: data.parentId ?? null,
      icon: data.icon ?? null,
      color: data.color ?? null,
      sortOrder: data.sortOrder ?? null,
      isDefault: data.isDefault ?? false,
      necessityLevel: data.necessityLevel ?? null,
    }));
  return mapTreeNode(envelope.category);
}

export async function updateCategory(
  id: string,
  data: UpdateCategoryRequest): Promise<FinCategory> {
  const envelope = await unwrap<CategoryOneEnvelope>(
    apiClient.put(`/finance/categories/${id}`, {
      name: data.name,
      kind: data.kind,
      parentId: data.parentId ?? null,
      icon: data.icon ?? null,
      color: data.color ?? null,
      sortOrder: data.sortOrder ?? null,
      isDefault: data.isDefault ?? false,
      necessityLevel: data.necessityLevel ?? null,
    }));
  return mapTreeNode(envelope.category);
}

export async function deleteCategory(id: string): Promise<string> {
  const envelope = await unwrap<{ id: string }>(
    apiClient.delete(`/finance/categories/${id}`));
  return envelope.id;
}
