import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToastStore } from "@/shared/stores/toastStore";
import { getFinanceApiErrorMessage } from "../utils/apiError";

import { invalidateDashboard } from "@/features/dashboard/lib/invalidateDashboard";

import { sourceKeys } from "../api/sourceKeys";
import { recalculateSourceBalance } from "../api/sourceBalanceApi";

export function useRecalculateSourceBalance(sourceId: string) {
  const qc = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: () => recalculateSourceBalance(sourceId),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: sourceKeys.all });
      invalidateDashboard(qc);
      addToast({
        type: "success",
        title: "Đã đồng bộ số dư",
        message:
          res.previousBalance !== res.newBalance
            ? `${String(res.previousBalance)} → ${String(res.newBalance)}`
            : undefined,
      });
    },
    onError: (e) => {
      addToast({
        type: "error",
        title: "Không đồng bộ được",
        message: getFinanceApiErrorMessage(e),
      });
    },
  });
}
