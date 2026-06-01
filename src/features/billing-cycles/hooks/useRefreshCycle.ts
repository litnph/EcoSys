import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToastStore } from "@/shared/stores/toastStore";

import { invalidateDashboard } from "@/features/dashboard/lib/invalidateDashboard";
import { getFinanceApiErrorMessage } from "@/features/sources/utils/apiError";

import { billingCycleKeys } from "../api/billingCycleKeys";
import { refreshCycle } from "../api/billingCyclesApi";

export function useRefreshCycle() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (cycleId: string) => refreshCycle(cycleId),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: billingCycleKeys.all });
      invalidateDashboard(queryClient);
      const added = result.addedCount;
      addToast({
        type: "success",
        title: "Đã làm mới sao kê",
        message:
          added > 0
            ? `Thêm ${String(added)} giao dịch trả sau vào kỳ.`
            : "Không có giao dịch mới phù hợp.",
      });
    },
    onError: (error) => {
      addToast({
        type: "error",
        title: "Không làm mới được sao kê",
        message: getFinanceApiErrorMessage(error),
      });
    },
  });
}
