"use client";

import { useQuery } from "@tanstack/react-query";

import { categoryKeys } from "../api/categoryKeys";
import { getFlatCategories } from "../api/categoriesApi";
import type { CategoryKind } from "../types";

const STALE_MS = 5 * 60 * 1000;

export function useFlatCategories(kind: CategoryKind | undefined) {
  return useQuery({
    queryKey: kind ? categoryKeys.flat(kind) : ["categories", "flat", "__"],
    queryFn: () => getFlatCategories(kind ?? "expense"),
    enabled: Boolean(kind),
    staleTime: STALE_MS,
  });
}
