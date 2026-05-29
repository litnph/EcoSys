import { useQuery } from "@tanstack/react-query";

import { sourceKeys } from "../api/sourceKeys";
import { getSourceTransactionCount } from "../api/sourcesApi";

export function useSourceTransactionCount(
  sourceId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: sourceId
      ? sourceKeys.txCount(sourceId)
      : ["sources", "txCount", "__"],
    queryFn: () => getSourceTransactionCount(sourceId ?? ""),
    enabled: enabled && Boolean(sourceId),
    staleTime: 15_000,
  });
}
