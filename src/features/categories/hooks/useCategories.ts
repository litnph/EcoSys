"use client";

import { useQuery } from "@tanstack/react-query";

import { categoryKeys } from "../api/categoryKeys";
import { getCategories } from "../api/categoriesApi";
import type { CategoryKind } from "../types";

const STALE_MS = 5 * 60 * 1000;

export function useCategories(
  smoduleId: string | undefined,
  kind: CategoryKind | undefined,
) {
  return useQuery({
    queryKey:
      smoduleId && kind
        ? categoryKeys.tree(smoduleId, kind)
        : ["categories", "tree", "__"],
    queryFn: () => getCategories(smoduleId ?? "", kind ?? "expense"),
    enabled: Boolean(smoduleId && kind),
    staleTime: STALE_MS,
  });
}
