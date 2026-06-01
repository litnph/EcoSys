import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToastStore } from "@/shared/stores/toastStore";
import { getFinanceApiErrorMessage } from "@/features/sources/utils/apiError";
import { billingCycleKeys } from "@/features/billing-cycles/api/billingCycleKeys";
import { invalidateDashboard } from "@/features/dashboard/lib/invalidateDashboard";

import { reportKeys } from "../api/reportKeys";
import { closeMonth } from "../api/reportsApi";

export interface CloseMonthPayload {
  year: number;
  month: number;
}

export function useCloseMonth() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ year, month }: CloseMonthPayload) =>
      closeMonth( year, month),
    onSuccess: (_data, { year, month }) => {
      void queryClient.invalidateQueries({
        queryKey: reportKeys.detail(year, month),
      });
      void queryClient.invalidateQueries({
        queryKey: reportKeys.list(),
      });
      void queryClient.invalidateQueries({ queryKey: billingCycleKeys.lists() });
      invalidateDashboard(queryClient);
      addToast({ type: "success", title: "Đã chốt báo cáo tháng" });
    },
    onError: (error) => {
      addToast({
        type: "error",
        title: "Không chốt được báo cáo",
        message: getFinanceApiErrorMessage(error),
      });
    },
  });
}
