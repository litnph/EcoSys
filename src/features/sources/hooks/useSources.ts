import { useQuery } from "@tanstack/react-query";

import { sourceKeys } from "../api/sourceKeys";
import { getSources } from "../api/sourcesApi";

export function useSources() {
  return useQuery({
    queryKey: sourceKeys.list(),
    queryFn: () => getSources(),
    staleTime: 30_000,
  });
}
