import { useMutation, useQueryClient } from "@tanstack/react-query";

import { sourceKeys } from "@/features/sources/api/sourceKeys";
import { transactionKeys } from "@/features/transactions/api/transactionKeys";
import { useToastStore } from "@/shared/stores/toastStore";
import { getFinanceApiErrorMessage } from "@/features/sources/utils/apiError";

import { installmentKeys } from "../api/installmentKeys";
import { createInstallmentPlan } from "../api/installmentsApi";
import type { CreateInstallmentPlanPayload } from "../types";

export function useCreateInstallmentPlan() {
  const qc = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (body: CreateInstallmentPlanPayload) =>
      createInstallmentPlan(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: installmentKeys.all });
      void qc.invalidateQueries({ queryKey: transactionKeys.lists() });
      void qc.invalidateQueries({ queryKey: sourceKeys.all });
      addToast({
        type: "success",
        title: "Đã tạo kế hoạch trả góp",
      });
    },
    onError: (e) => {
      addToast({
        type: "error",
        title: "Không tạo được kế hoạch",
        message: getFinanceApiErrorMessage(e),
      });
    },
  });
}
