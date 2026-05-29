import { useQuery } from "@tanstack/react-query";

import { installmentKeys } from "../api/installmentKeys";
import { getInstallmentPlanDetail } from "../api/installmentsApi";

export function useInstallmentPlanDetail(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: id ? installmentKeys.detail(id) : installmentKeys.detail("__"),
    queryFn: () => getInstallmentPlanDetail(id ?? ""),
    enabled: Boolean(id && enabled),
    staleTime: 12_000,
  });
}
