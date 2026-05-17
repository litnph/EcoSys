"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToastStore } from "@/shared/stores/toastStore";

import { getFinanceApiErrorMessage } from "@/features/sources/utils/apiError";

import { billingCycleKeys } from "../api/billingCycleKeys";
import { closeCycle } from "../api/billingCyclesApi";

export function useCloseCycle() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (id: string) => closeCycle(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: billingCycleKeys.all });
      addToast({
        type: "success",
        title: "Đã đóng kỳ sao kê",
      });
    },
    onError: (error) => {
      addToast({
        type: "error",
        title: "Không đóng được kỳ",
        message: getFinanceApiErrorMessage(error),
      });
    },
  });
}
