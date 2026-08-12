import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidateDashboard } from "@/features/dashboard/lib/invalidateDashboard";
import { sourceKeys } from "@/features/sources/api/sourceKeys";
import { transactionKeys } from "@/features/transactions/api/transactionKeys";
import { useToastStore } from "@/shared/stores/toastStore";
import { getFinanceApiErrorMessage } from "@/features/sources/utils/apiError";

import { installmentKeys } from "../api/installmentKeys";
import { recordInstallmentPayment } from "../api/installmentsApi";

export function useRecordInstallmentPayment() {
  const qc = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (args: {
      planId: string;
      installmentNumber: number;
      paymentSourceId: string;
      expectedVersion: number;
    }) =>
      recordInstallmentPayment(
        args.planId,
        args.installmentNumber,
        args.paymentSourceId,
        args.expectedVersion),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: installmentKeys.all });
      void qc.invalidateQueries({ queryKey: transactionKeys.lists() });
      void qc.invalidateQueries({ queryKey: sourceKeys.all });
      invalidateDashboard(qc);
      addToast({ type: "success", title: "Đã ghi nhận thanh toán kỳ" });
    },
    onError: (e) => {
      addToast({
        type: "error",
        title: "Không thanh toán được",
        message: getFinanceApiErrorMessage(e),
      });
    },
  });
}
