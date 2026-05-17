"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToastStore } from "@/shared/stores/toastStore";

import { transactionKeys } from "@/features/transactions/api/transactionKeys";

import { getFinanceApiErrorMessage } from "@/features/sources/utils/apiError";

import { billingCycleKeys } from "../api/billingCycleKeys";
import { payCycle } from "../api/billingCyclesApi";
import type { PayCyclePayload } from "../types";

export function usePayCycle() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: PayCyclePayload }) =>
      payCycle(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: billingCycleKeys.all });
      void queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      addToast({
        type: "success",
        title: "Đã ghi nhận thanh toán",
      });
    },
    onError: (error) => {
      addToast({
        type: "error",
        title: "Không thanh toán được",
        message: getFinanceApiErrorMessage(error),
      });
    },
  });
}
