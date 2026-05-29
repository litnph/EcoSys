import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToastStore } from "@/shared/stores/toastStore";
import { getFinanceApiErrorMessage } from "@/features/sources/utils/apiError";
import { billingCycleKeys } from "@/features/billing-cycles/api/billingCycleKeys";
import { transactionKeys } from "@/features/transactions/api/transactionKeys";

import { reportKeys } from "../api/reportKeys";
import { deleteMonthlyReport } from "../api/reportsApi";

export interface DeleteMonthlyReportPayload {
  year: number;
  month: number;
}

export function useDeleteMonthlyReport() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ year, month }: DeleteMonthlyReportPayload) =>
      deleteMonthlyReport(year, month),
    onSuccess: (_data, { year, month }) => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.list() });
      void queryClient.removeQueries({
        queryKey: reportKeys.detail(year, month),
      });
      void queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: billingCycleKeys.lists() });
      addToast({ type: "success", title: "Đã xóa báo cáo tháng" });
    },
    onError: (error) => {
      addToast({
        type: "error",
        title: "Không xóa được báo cáo",
        message: getFinanceApiErrorMessage(error),
      });
    },
  });
}
