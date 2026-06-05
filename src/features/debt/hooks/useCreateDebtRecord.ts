import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidateDashboard } from "@/features/dashboard/lib/invalidateDashboard";
import { useToastStore } from "@/shared/stores/toastStore";
import { getFinanceApiErrorMessage } from "@/features/sources/utils/apiError";

import { createDebtRecord, type CreateDebtRecordPayload } from "../api/debtApi";
import { debtKeys } from "../api/debtKeys";

export function useCreateDebtRecord() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (payload: CreateDebtRecordPayload) => createDebtRecord(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: debtKeys.all });
      invalidateDashboard(queryClient);
      addToast({
        type: "success",
        title: "Đã ghi nhận nợ hiện có",
      });
    },
    onError: (error) => {
      addToast({
        type: "error",
        title: "Không ghi nhận được",
        message: getFinanceApiErrorMessage(error),
      });
    },
  });
}
