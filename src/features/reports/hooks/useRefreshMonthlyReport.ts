import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToastStore } from "@/shared/stores/toastStore";
import { getFinanceApiErrorMessage } from "@/features/sources/utils/apiError";

import { reportKeys } from "../api/reportKeys";
import { refreshMonthlyReport } from "../api/reportsApi";

export interface RefreshMonthlyReportPayload {
  year: number;
  month: number;
}

export function useRefreshMonthlyReport() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ year, month }: RefreshMonthlyReportPayload) =>
      refreshMonthlyReport(year, month),
    onSuccess: (_data, { year, month }) => {
      void queryClient.invalidateQueries({
        queryKey: reportKeys.detail(year, month),
      });
      void queryClient.invalidateQueries({ queryKey: reportKeys.list() });
      addToast({ type: "success", title: "Đã cập nhật báo cáo" });
    },
    onError: (error) => {
      addToast({
        type: "error",
        title: "Không cập nhật được báo cáo",
        message: getFinanceApiErrorMessage(error),
      });
    },
  });
}
