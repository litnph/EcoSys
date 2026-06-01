import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToastStore } from "@/shared/stores/toastStore";

import { getFinanceApiErrorMessage } from "@/features/sources/utils/apiError";
import { invalidateDashboard } from "@/features/dashboard/lib/invalidateDashboard";
import { transactionKeys } from "@/features/transactions/api/transactionKeys";

import { debtKeys } from "../api/debtKeys";
import { deleteDebtRecord } from "../api/debtApi";

export function useDeleteDebtRecord() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (id: string) => deleteDebtRecord(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: debtKeys.all });
      void queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      invalidateDashboard(queryClient);
      addToast({
        type: "success",
        title: "Đã xóa khoản nợ",
      });
    },
    onError: (error) => {
      addToast({
        type: "error",
        title: "Không xóa được",
        message: getFinanceApiErrorMessage(error),
      });
    },
  });
}
