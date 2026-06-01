import type { FinCategoryFlat } from "@/features/categories/types";

import type { CategoryRollupLevel } from "../types";

function normalizeCategoryName(name: string): string {
  return name.trim().toLocaleLowerCase("vi");
}

/** Report breakdown often has null categoryId — index names for lookup. */
export function buildCategoryNameIndex(
  categories: FinCategoryFlat[],
): Map<string, FinCategoryFlat[]> {
  const index = new Map<string, FinCategoryFlat[]>();
  for (const cat of categories) {
    const key = normalizeCategoryName(cat.name);
    const list = index.get(key) ?? [];
    list.push(cat);
    index.set(key, list);
  }
  return index;
}

function isUncategorisedLabel(name: string): boolean {
  const n = normalizeCategoryName(name);
  return (
    n.length === 0 ||
    n === "(uncategorised)" ||
    n === "uncategorised" ||
    n === "—" ||
    n === "không phân loại"
  );
}

/** Match report row to a category: id first, then exact name (prefer deepest). */
export function resolveCategoryFromBreakdown(
  categoryId: string | null,
  categoryName: string,
  categoryMap: Map<string, FinCategoryFlat>,
  nameIndex: Map<string, FinCategoryFlat[]>,
): FinCategoryFlat | null {
  if (categoryId) {
    const byId = categoryMap.get(categoryId);
    if (byId) return byId;
  }

  const label = categoryName.trim();
  if (isUncategorisedLabel(label)) return null;

  const matches = nameIndex.get(normalizeCategoryName(label));
  if (!matches?.length) return null;
  if (matches.length === 1) return matches[0]!;

  return [...matches].sort((a, b) => b.depth - a.depth)[0]!;
}

/** Walk up to top-level parent (parentId === null). */
export function resolveRootCategory(
  cat: FinCategoryFlat,
  categoryMap: Map<string, FinCategoryFlat>,
): FinCategoryFlat {
  let current = cat;
  const guard = new Set<string>();

  while (current.parentId && !guard.has(current.id)) {
    guard.add(current.id);
    const parent = categoryMap.get(current.parentId);
    if (!parent) break;
    current = parent;
  }

  return current;
}

export function bucketCategoryForLevel(
  categoryId: string | null,
  categoryName: string,
  level: CategoryRollupLevel,
  categoryMap: Map<string, FinCategoryFlat>,
  nameIndex: Map<string, FinCategoryFlat[]>,
): { key: string; name: string } {
  const label = categoryName.trim() || "—";
  const cat = resolveCategoryFromBreakdown(
    categoryId,
    categoryName,
    categoryMap,
    nameIndex,
  );

  if (!cat) {
    return { key: `uncat:${normalizeCategoryName(label)}`, name: label };
  }

  if (level === "parent") {
    const root = resolveRootCategory(cat, categoryMap);
    return { key: root.id, name: root.name };
  }

  return { key: cat.id, name: cat.name };
}
