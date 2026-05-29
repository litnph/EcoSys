import { useQuery } from "@tanstack/react-query";

import { sourceKeys } from "../api/sourceKeys";
import { getSourceBalanceLedger } from "../api/sourceBalanceApi";

export function useSourceBalanceLedger(sourceId: string | undefined) {
  return useQuery({
    queryKey: sourceKeys.balanceLedger(sourceId ?? ""),
    queryFn: () => getSourceBalanceLedger(sourceId!),
    enabled: Boolean(sourceId),
    staleTime: 15_000,
  });
}
