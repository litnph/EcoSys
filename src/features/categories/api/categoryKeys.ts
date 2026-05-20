import type { CategoryKind } from "../types";

export const categoryKeys = {
  all: ["categories"] as const,
  trees: () => [...categoryKeys.all, "tree"] as const,
  tree: (kind: CategoryKind) =>
    [...categoryKeys.trees(), kind] as const,
  flats: () => [...categoryKeys.all, "flat"] as const,
  flat: (kind: CategoryKind) =>
    [...categoryKeys.flats(), kind] as const,
};
