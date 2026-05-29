import { useMutation, useQueryClient } from "@tanstack/react-query";

import { sourceKeys } from "@/features/sources/api/sourceKeys";
import { transactionKeys } from "@/features/transactions/api/transactionKeys";
import { useToastStore } from "@/shared/stores/toastStore";
import { getFinanceApiErrorMessage } from "@/features/sources/utils/apiError";

import { installmentKeys } from "../api/installmentKeys";
import { deleteInstallmentPlan } from "../api/installmentsApi";

export type DeleteInstallmentPlanVariables = {
  id: string;
  originalTxnId?: string;
};

export function useDeleteInstallmentPlan() {
  const qc = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ id }: DeleteInstallmentPlanVariables) =>
      deleteInstallmentPlan(id),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: installmentKeys.all });
      void qc.invalidateQueries({ queryKey: sourceKeys.all });
      void qc.invalidateQueries({ queryKey: transactionKeys.lists() });
      if (variables.originalTxnId) {
        void qc.invalidateQueries({
          queryKey: transactionKeys.detail(variables.originalTxnId),
        });
      }
      addToast({
        type: "success",
        title: "Đã xóa kế hoạch trả góp",
        message:
          "Dư nợ thẻ đã được hoàn lại (nếu có kỳ backfill). Giao dịch gốc có thể chỉnh sửa lại.",
      });
    },
    onError: (e) => {
      addToast({
        type: "error",
        title: "Không xóa được",
        message: getFinanceApiErrorMessage(e),
      });
    },
  });
}
