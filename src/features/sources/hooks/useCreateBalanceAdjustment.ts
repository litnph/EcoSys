import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToastStore } from "@/shared/stores/toastStore";
import { getFinanceApiErrorMessage } from "../utils/apiError";

import { invalidateDashboard } from "@/features/dashboard/lib/invalidateDashboard";
import { transactionKeys } from "@/features/transactions/api/transactionKeys";

import { sourceKeys } from "../api/sourceKeys";
import { createBalanceAdjustment } from "../api/sourceBalanceApi";
import type { CreateBalanceAdjustmentPayload } from "../types/balanceLedger";

export function useCreateBalanceAdjustment(sourceId: string) {
  const qc = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (payload: CreateBalanceAdjustmentPayload) =>
      createBalanceAdjustment(sourceId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: sourceKeys.all });
      void qc.invalidateQueries({ queryKey: sourceKeys.balanceLedger(sourceId) });
      void qc.invalidateQueries({ queryKey: transactionKeys.lists() });
      void qc.invalidateQueries({ queryKey: transactionKeys.all });
      invalidateDashboard(qc);
      addToast({ type: "success", title: "Đã ghi điều chỉnh số dư" });
    },
    onError: (e) => {
      addToast({
        type: "error",
        title: "Không ghi được điều chỉnh",
        message: getFinanceApiErrorMessage(e),
      });
    },
  });
}
