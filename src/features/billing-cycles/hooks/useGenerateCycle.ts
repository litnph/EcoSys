import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToastStore } from "@/shared/stores/toastStore";

import { invalidateDashboard } from "@/features/dashboard/lib/invalidateDashboard";
import { getFinanceApiErrorMessage } from "@/features/sources/utils/apiError";

import {
  generateCycle,
  type GenerateCyclePayload,
} from "../api/billingCyclesApi";
import { billingCycleKeys } from "../api/billingCycleKeys";

export function useGenerateCycle() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (payload: GenerateCyclePayload) => generateCycle(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: billingCycleKeys.all });
      invalidateDashboard(queryClient);
      addToast({
        type: "success",
        title: "Đã tạo kỳ sao kê",
      });
    },
    onError: (error) => {
      addToast({
        type: "error",
        title: "Không tạo được kỳ sao kê",
        message: getFinanceApiErrorMessage(error),
      });
    },
  });
}
