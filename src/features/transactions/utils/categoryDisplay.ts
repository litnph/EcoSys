import type { FinCategoryFlat } from "@/features/categories/types";

import type { Transaction } from "../types";

export interface CategoryColumnDisplay {
  parentLabel: string;
  parentColor: string | null;
  categoryLabel: string;
  categoryColor: string | null;
}

export function resolveCategoryColumns(
  categoryId: string | null | undefined,
  categoryMap: Map<string, FinCategoryFlat> | undefined,
  fallbackCategoryName?: string | null,
): CategoryColumnDisplay {
  if (!categoryId || !categoryMap) {
    return {
      parentLabel: "—",
      parentColor: null,
      categoryLabel: fallbackCategoryName?.trim() || "—",
      categoryColor: null,
    };
  }

  const cat = categoryMap.get(categoryId);
  if (!cat) {
    return {
      parentLabel: "—",
      parentColor: null,
      categoryLabel: fallbackCategoryName?.trim() || "—",
      categoryColor: null,
    };
  }

  if (cat.parentId) {
    const parent = categoryMap.get(cat.parentId);
    return {
      parentLabel: parent?.name ?? "—",
      parentColor: parent?.color ?? null,
      categoryLabel: cat.name,
      categoryColor: cat.color,
    };
  }

  return {
    parentLabel: cat.name,
    parentColor: cat.color,
    categoryLabel: "—",
    categoryColor: null,
  };
}

export function passesParentCategoryFilter(
  tx: Transaction,
  parentCategoryId: string,
  categoryMap: Map<string, FinCategoryFlat> | undefined,
): boolean {
  if (!tx.categoryId || !categoryMap) return false;
  const cat = categoryMap.get(tx.categoryId);
  if (!cat) return false;
  if (cat.id === parentCategoryId) return true;
  return cat.parentId === parentCategoryId;
}
