import { useMutation, useQueryClient } from "@tanstack/react-query";

import { debtKeys } from "@/features/debt/api/debtKeys";
import { dashboardKeys } from "@/features/dashboard/api/dashboardKeys";
import { sourceKeys } from "@/features/sources/api/sourceKeys";
import { useToastStore } from "@/shared/stores/toastStore";

import { createTransaction, type CreateTransactionBody } from "../api/transactionsApi";
import { transactionKeys } from "../api/transactionKeys";

export function useCreateTransaction() {
  const qc = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (body: CreateTransactionBody) => createTransaction(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: transactionKeys.lists() });
      void qc.invalidateQueries({ queryKey: transactionKeys.all });
      void qc.invalidateQueries({ queryKey: debtKeys.all });
      void qc.invalidateQueries({ queryKey: sourceKeys.lists() });
      void qc.invalidateQueries({ queryKey: dashboardKeys.summary() });
      void qc.invalidateQueries({ queryKey: dashboardKeys.all });
      addToast({
        type: "success",
        title: "Đã tạo giao dịch",
      });
    },
  });
}
