import { useQuery } from "@tanstack/react-query";

import { debtKeys } from "../api/debtKeys";
import { getDebtRecords } from "../api/debtApi";
import type { DebtDirection, DebtStatus } from "../types";

export function useDebtRecords(
  direction: DebtDirection | undefined,
  opts?: {
    enabled?: boolean;
    status?: DebtStatus;
  },
) {
  const status = opts?.status ?? "active";

  return useQuery({
    queryKey: debtKeys.list(direction, status),
    queryFn: () =>
      getDebtRecords({
        direction,
        status,
      }),
    enabled: Boolean(direction) && opts?.enabled !== false,
    staleTime: 20_000,
  });
}
