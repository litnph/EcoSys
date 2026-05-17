"use client";

import { useQuery } from "@tanstack/react-query";

import { installmentKeys } from "../api/installmentKeys";
import { getInstallmentPlans } from "../api/installmentsApi";
import type { InstallmentStatus } from "../types";

export function useInstallmentPlans(
  smoduleId: string | undefined,
  status?: InstallmentStatus,
) {
  return useQuery({
    queryKey: smoduleId
      ? installmentKeys.list(smoduleId, status)
      : installmentKeys.list("__", status),
    queryFn: () => getInstallmentPlans(smoduleId ?? "", status),
    enabled: Boolean(smoduleId && smoduleId.length > 0),
    staleTime: 12_000,
  });
}
