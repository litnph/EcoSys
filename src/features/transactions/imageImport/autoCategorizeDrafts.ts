import type { ClassificationMatch } from "@/features/settings/types";

import type { ImageImportDraft } from "./types";

/** Applies server matches only to empty fields so a user's review choices always win. */
export function applyClassificationMatches(
  drafts: ImageImportDraft[],
  matches: ClassificationMatch[],
): ImageImportDraft[] {
  const byKey = new Map(matches.map((match) => [match.key, match]));
  return drafts.map((draft) => {
    if (draft.isRefund || draft.direction !== "expense") return draft;
    const match = byKey.get(draft.id);
    if (!match) return draft;
    return {
      ...draft,
      categoryId: draft.categoryId || match.categoryId || "",
      tagIds: draft.tagIds.length > 0 || !match.tagId ? draft.tagIds : [match.tagId],
    };
  });
}
