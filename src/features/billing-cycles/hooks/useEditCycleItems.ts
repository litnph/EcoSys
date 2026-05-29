import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToastStore } from "@/shared/stores/toastStore";

import { getFinanceApiErrorMessage } from "@/features/sources/utils/apiError";

import { billingCycleKeys } from "../api/billingCycleKeys";
import { addCycleItem, removeCycleItem } from "../api/billingCyclesApi";

function invalidateCycle(queryClient: ReturnType<typeof useQueryClient>, cycleId: string) {
  void queryClient.invalidateQueries({ queryKey: billingCycleKeys.all });
  void queryClient.invalidateQueries({ queryKey: billingCycleKeys.detail(cycleId) });
  void queryClient.invalidateQueries({ queryKey: billingCycleKeys.addable(cycleId) });
}

export function useAddCycleItem(cycleId: string) {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (transactionId: string) => addCycleItem(cycleId, transactionId),
    onSuccess: () => {
      invalidateCycle(queryClient, cycleId);
      addToast({ type: "success", title: "Đã thêm giao dịch vào kỳ" });
    },
    onError: (error) => {
      addToast({
        type: "error",
        title: "Không thêm được giao dịch",
        message: getFinanceApiErrorMessage(error),
      });
    },
  });
}

export function useRemoveCycleItem(cycleId: string) {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (transactionId: string) => removeCycleItem(cycleId, transactionId),
    onSuccess: () => {
      invalidateCycle(queryClient, cycleId);
      addToast({ type: "success", title: "Đã loại giao dịch khỏi kỳ" });
    },
    onError: (error) => {
      addToast({
        type: "error",
        title: "Không loại được giao dịch",
        message: getFinanceApiErrorMessage(error),
      });
    },
  });
}
