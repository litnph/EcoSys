"use client";

import { useQuery } from "@tanstack/react-query";

import { categoryKeys } from "../api/categoryKeys";
import { getFlatCategories } from "../api/categoriesApi";
import type { CategoryKind } from "../types";

const STALE_MS = 5 * 60 * 1000;

export function useFlatCategories(
  smoduleId: string | undefined,
  kind: CategoryKind | undefined,
) {
  return useQuery({
    queryKey:
      smoduleId && kind
        ? categoryKeys.flat(smoduleId, kind)
        : ["categories", "flat", "__"],
    queryFn: () => getFlatCategories(smoduleId ?? "", kind ?? "expense"),
    enabled: Boolean(smoduleId && kind),
    staleTime: STALE_MS,
  });
}
