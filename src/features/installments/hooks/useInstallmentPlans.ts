"use client";

import { useQuery } from "@tanstack/react-query";

import { installmentKeys } from "../api/installmentKeys";
import { getInstallmentPlans } from "../api/installmentsApi";
import type { InstallmentStatus } from "../types";

export function useInstallmentPlans(status?: InstallmentStatus) {
  return useQuery({
    queryKey: installmentKeys.list(status),
    queryFn: () => getInstallmentPlans(status),
    enabled: true,
    staleTime: 12_000,
  });
}
