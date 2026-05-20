"use client";

import { useQuery } from "@tanstack/react-query";

import { billingCycleKeys } from "../api/billingCycleKeys";
import {
  getBillingCycleDetail,
  getBillingCycles,
} from "../api/billingCyclesApi";
import type { BillingCycleStatus } from "../types";

export function useBillingCycles(
  sourceId?: string,
  status?: BillingCycleStatus,
) {
  return useQuery({
    queryKey: billingCycleKeys.list(sourceId, status),
    queryFn: () => getBillingCycles(sourceId, status),
    enabled: true,
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
