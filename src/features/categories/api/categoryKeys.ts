import type { CategoryKind } from "../types";

export const categoryKeys = {
  all: ["categories"] as const,
  trees: () => [...categoryKeys.all, "tree"] as const,
  tree: (smoduleId: string, kind: CategoryKind) =>
    [...categoryKeys.trees(), smoduleId, kind] as const,
  flats: () => [...categoryKeys.all, "flat"] as const,
  flat: (smoduleId: string, kind: CategoryKind) =>
    [...categoryKeys.flats(), smoduleId, kind] as const,
};
