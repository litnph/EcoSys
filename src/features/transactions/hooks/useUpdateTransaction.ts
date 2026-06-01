import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToastStore } from "@/shared/stores/toastStore";

import {
  updateTransaction,
  type UpdateTransactionPayload,
} from "../api/transactionsApi";
import { invalidateDashboard } from "@/features/dashboard/lib/invalidateDashboard";
import { sourceKeys } from "@/features/sources/api/sourceKeys";
import { debtKeys } from "@/features/debt/api/debtKeys";

import { transactionKeys } from "../api/transactionKeys";

export function useUpdateTransaction() {
  const qc = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateTransactionPayload;
    }) => updateTransaction(id, payload),
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: transactionKeys.detail(data.id) });
      await qc.invalidateQueries({ queryKey: transactionKeys.lists() });
      await qc.invalidateQueries({ queryKey: transactionKeys.all });
      await qc.invalidateQueries({ queryKey: sourceKeys.all });
      await qc.invalidateQueries({ queryKey: debtKeys.all });
      invalidateDashboard(qc);
      addToast({ type: "success", title: "Đã cập nhật giao dịch" });
    },
    onError: (e: Error) => {
      addToast({
        type: "error",
        title: "Không cập nhật được",
        message: e.message,
      });
    },
  });
}
