"use client";

import { useQuery } from "@tanstack/react-query";

import { debtKeys } from "../api/debtKeys";
import { getDebtSummary } from "../api/debtApi";

export function useDebtSummary(
  smoduleId: string | undefined,
  opts?: { enabled?: boolean },
) {
  const enabled =
    Boolean(smoduleId && smoduleId.length > 0) && opts?.enabled !== false;

  return useQuery({
    queryKey: debtKeys.summary(smoduleId ?? ""),
    queryFn: () => getDebtSummary(smoduleId!),
    enabled,
    staleTime: 20_000,
  });
}
