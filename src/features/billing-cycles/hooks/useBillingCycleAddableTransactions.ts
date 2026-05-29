import { useQuery } from "@tanstack/react-query";

import { billingCycleKeys } from "../api/billingCycleKeys";
import { getBillingCycleAddableTransactions } from "../api/billingCyclesApi";

export function useBillingCycleAddableTransactions(
  cycleId: string | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: billingCycleKeys.addable(cycleId ?? "__none__"),
    queryFn: () => getBillingCycleAddableTransactions(cycleId!),
    enabled: Boolean(cycleId && enabled),
    staleTime: 10_000,
  });
}
