import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToastStore } from "@/shared/stores/toastStore";

import { invalidateDashboard } from "@/features/dashboard/lib/invalidateDashboard";
import { getFinanceApiErrorMessage } from "@/features/sources/utils/apiError";

import { billingCycleKeys } from "../api/billingCycleKeys";
import { deleteCycle } from "../api/billingCyclesApi";

export function useDeleteCycle() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (cycleId: string) => deleteCycle(cycleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: billingCycleKeys.all });
      invalidateDashboard(queryClient);
      addToast({
        type: "success",
        title: "Đã xóa kỳ sao kê",
      });
    },
    onError: (error) => {
      addToast({
        type: "error",
        title: "Không xóa được kỳ sao kê",
        message: getFinanceApiErrorMessage(error),
      });
    },
  });
}
