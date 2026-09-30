import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidateBudgetAwareness } from "@/features/budgets/lib/invalidateBudgetAwareness";
import { invalidateDashboard } from "@/features/dashboard/lib/invalidateDashboard";
import { getFinanceApiErrorMessage } from "@/features/sources/utils/apiError";
import { transactionKeys } from "@/features/transactions/api/transactionKeys";
import { useToastStore } from "@/shared/stores/toastStore";

import { reportKeys } from "../api/reportKeys";
import { addMonthlyReportTransaction } from "../api/reportsApi";

export function useAddMonthlyReportTransaction(year: number, month: number) {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);

  return useMutation({
    mutationFn: (transactionId: string) =>
      addMonthlyReportTransaction(year, month, transactionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: reportKeys.detail(year, month),
      });
      void queryClient.invalidateQueries({
        queryKey: reportKeys.addable(year, month),
      });
      void queryClient.invalidateQueries({ queryKey: reportKeys.list() });
      void queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      invalidateDashboard(queryClient);
      void invalidateBudgetAwareness(queryClient);
      addToast({
        type: "success",
        title: "Đã thêm giao dịch vào báo cáo tháng",
      });
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
