import {
  attachTagToEntity,
  detachTagFromEntity,
} from "@/features/tags/api/tagsApi";

export async function syncTransactionTags(
  transactionId: string,
  previousTagIds: string[],
  nextTagIds: string[],
): Promise<void> {
  const prev = new Set(previousTagIds);
  const next = new Set(nextTagIds);
  const toAttach = nextTagIds.filter((id) => !prev.has(id));
  const toDetach = previousTagIds.filter((id) => !next.has(id));

  for (const tagId of toAttach) {
    await attachTagToEntity(tagId, transactionId);
  }
  for (const tagId of toDetach) {
    await detachTagFromEntity(tagId, transactionId);
  }
}
