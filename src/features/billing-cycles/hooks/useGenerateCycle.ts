"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToastStore } from "@/shared/stores/toastStore";

import { billingCycleKeys } from "../api/billingCycleKeys";
import { generateCycle } from "../api/billingCyclesApi";
import { getFinanceApiErrorMessage } from "@/features/sources/utils/apiError";

export function useGenerateCycle() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (sourceId: string) => generateCycle(sourceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: billingCycleKeys.all });
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
