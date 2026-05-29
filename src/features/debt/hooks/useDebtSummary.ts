import { useQuery } from "@tanstack/react-query";

import { debtKeys } from "../api/debtKeys";
import { getDebtSummary } from "../api/debtApi";

export function useDebtSummary(opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: debtKeys.summary(),
    queryFn: () => getDebtSummary(),
    enabled: opts?.enabled !== false,
    staleTime: 20_000,
  });
}
