import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToastStore } from "@/shared/stores/toastStore";
import { invalidateDashboard } from "@/features/dashboard/lib/invalidateDashboard";
import { getFinanceApiErrorMessage } from "@/features/sources/utils/apiError";

import { installmentKeys } from "../api/installmentKeys";
import { cancelInstallmentPlan } from "../api/installmentsApi";

export function useCancelInstallmentPlan() {
  const qc = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      cancelInstallmentPlan(id, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: installmentKeys.all });
      invalidateDashboard(qc);
      addToast({ type: "success", title: "Đã hủy kế hoạch trả góp" });
    },
    onError: (e) => {
      addToast({
        type: "error",
        title: "Không hủy được",
        message: getFinanceApiErrorMessage(e),
      });
    },
  });
}
