"use client";

import { useQuery } from "@tanstack/react-query";

import { sourceKeys } from "../api/sourceKeys";
import { getSources } from "../api/sourcesApi";

export function useSources(smoduleId: string | undefined) {
  return useQuery({
    queryKey: smoduleId ? sourceKeys.list(smoduleId) : ["sources", "__"],
    queryFn: () => getSources(smoduleId ?? ""),
    enabled: Boolean(smoduleId && smoduleId.length > 0),
    staleTime: 30_000,
  });
}
