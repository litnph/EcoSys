"use client";

import { useQuery } from "@tanstack/react-query";

import { sourceKeys } from "../api/sourceKeys";
import { getSourceTransactionCount } from "../api/sourcesApi";

export function useSourceTransactionCount(
  smoduleId: string | undefined,
  sourceId: string | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey:
      smoduleId && sourceId
        ? sourceKeys.txCount(smoduleId, sourceId)
        : ["sources", "txCount", "__"],
    queryFn: () =>
      getSourceTransactionCount(smoduleId ?? "", sourceId ?? ""),
    enabled: Boolean(
      enabled && smoduleId && sourceId && smoduleId.length > 0,
    ),
    staleTime: 15_000,
  });
}
