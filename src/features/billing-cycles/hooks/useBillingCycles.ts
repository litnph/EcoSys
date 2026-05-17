"use client";

import { useQuery } from "@tanstack/react-query";

import { billingCycleKeys } from "../api/billingCycleKeys";
import {
  getBillingCycleDetail,
  getBillingCycles,
} from "../api/billingCyclesApi";
import type { BillingCycleStatus } from "../types";

export function useBillingCycles(
  smoduleId: string | undefined,
  sourceId?: string,
  status?: BillingCycleStatus,
) {
  return useQuery({
    queryKey: smoduleId
      ? billingCycleKeys.list(smoduleId, sourceId, status)
      : billingCycleKeys.list("__", sourceId, status),
    queryFn: () => getBillingCycles(smoduleId ?? "", sourceId, status),
    enabled: Boolean(smoduleId && smoduleId.length > 0),
    staleTime: 15_000,
  });
}

export function useBillingCycleDetail(cycleId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: cycleId
      ? billingCycleKeys.detail(cycleId)
      : billingCycleKeys.detail("__"),
    queryFn: () => getBillingCycleDetail(cycleId ?? ""),
    enabled: Boolean(cycleId && enabled),
    staleTime: 15_000,
  });
}
