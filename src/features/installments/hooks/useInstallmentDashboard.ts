import { useQuery } from "@tanstack/react-query";

import { installmentKeys } from "../api/installmentKeys";
import { getInstallmentDashboard } from "../api/installmentsApi";

export function useInstallmentDashboard() {
  return useQuery({
    queryKey: installmentKeys.dashboard(),
    queryFn: getInstallmentDashboard,
    staleTime: 30_000,
  });
}
