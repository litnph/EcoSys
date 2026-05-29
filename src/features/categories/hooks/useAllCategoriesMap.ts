import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";

import { categoryKeys } from "../api/categoryKeys";
import { getFlatCategories } from "../api/categoriesApi";
import type { CategoryKind, FinCategoryFlat } from "../types";

const KINDS: CategoryKind[] = ["expense", "income", "transfer"];

export function useAllCategoriesMap() {
  const queries = useQueries({
    queries: KINDS.map((kind) => ({
      queryKey: categoryKeys.flat(kind),
      queryFn: () => getFlatCategories(kind),
      staleTime: 5 * 60 * 1000,
    })),
  });

  return useMemo(() => {
    const map = new Map<string, FinCategoryFlat>();
    for (const q of queries) {
      for (const row of q.data ?? []) {
        map.set(row.id, row);
      }
    }
    return map;
  }, [queries]);
}
