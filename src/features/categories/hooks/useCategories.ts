import { useQuery } from "@tanstack/react-query";

import { categoryKeys } from "../api/categoryKeys";
import { getCategories } from "../api/categoriesApi";
import type { CategoryKind } from "../types";

const STALE_MS = 5 * 60 * 1000;

export function useCategories(kind: CategoryKind | undefined) {
  return useQuery({
    queryKey: kind ? categoryKeys.tree(kind) : ["categories", "tree", "__"],
    queryFn: () => getCategories(kind ?? "expense"),
    enabled: Boolean(kind),
    staleTime: STALE_MS,
  });
}
