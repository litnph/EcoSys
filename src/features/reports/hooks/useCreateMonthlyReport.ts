import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToastStore } from "@/shared/stores/toastStore";
import { getFinanceApiErrorMessage } from "@/features/sources/utils/apiError";

import { reportKeys } from "../api/reportKeys";
import { createMonthlyReport } from "../api/reportsApi";

export interface CreateMonthlyReportPayload {
  year: number;
  month: number;
}

export function useCreateMonthlyReport() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ year, month }: CreateMonthlyReportPayload) =>
      createMonthlyReport(year, month),
    onSuccess: (_data, { year, month }) => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: reportKeys.detail(year, month),
      });
      addToast({ type: "success", title: "Đã tạo báo cáo tháng" });
    },
    onError: (error) => {
      addToast({
        type: "error",
        title: "Không tạo được báo cáo",
        message: getFinanceApiErrorMessage(error),
      });
    },
  });
}
