"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToastStore } from "@/shared/stores/toastStore";
import { getFinanceApiErrorMessage } from "@/features/sources/utils/apiError";
import { billingCycleKeys } from "@/features/billing-cycles/api/billingCycleKeys";

import { reportKeys } from "../api/reportKeys";
import { closeMonth } from "../api/reportsApi";

export interface CloseMonthPayload {
  smoduleId: string;
  year: number;
  month: number;
}

export function useCloseMonth() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ smoduleId, year, month }: CloseMonthPayload) =>
      closeMonth(smoduleId, year, month),
    onSuccess: (_data, { smoduleId, year, month }) => {
      void queryClient.invalidateQueries({
        queryKey: reportKeys.detail(smoduleId, year, month),
      });
      void queryClient.invalidateQueries({
        queryKey: reportKeys.list(smoduleId),
      });
      void queryClient.invalidateQueries({ queryKey: billingCycleKeys.lists() });
      addToast({ type: "success", title: "Đã chốt tháng" });
    },
    onError: (error) => {
      addToast({
        type: "error",
        title: "Không chốt được tháng",
        message: getFinanceApiErrorMessage(error),
      });
    },
  });
}
