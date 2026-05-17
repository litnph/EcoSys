"use client";

import { useQuery } from "@tanstack/react-query";

import { debtKeys } from "../api/debtKeys";
import { getDebtRecords } from "../api/debtApi";
import type { DebtDirection, DebtStatus } from "../types";

export function useDebtRecords(
  smoduleId: string | undefined,
  direction: DebtDirection | undefined,
  opts?: {
    enabled?: boolean;
    status?: DebtStatus;
  },
) {
  const enabled =
    Boolean(smoduleId && smoduleId.length > 0 && direction) &&
    opts?.enabled !== false;

  const status = opts?.status ?? "active";

  return useQuery({
    queryKey: debtKeys.list(smoduleId ?? "", direction, status),
    queryFn: () =>
      getDebtRecords(smoduleId!, {
        direction,
        status,
      }),
    enabled,
    staleTime: 20_000,
  });
}
