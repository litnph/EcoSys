import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useToastStore } from "@/shared/stores/toastStore";
import { getFinanceApiErrorMessage } from "../utils/apiError";

import { sourceKeys } from "../api/sourceKeys";
import {
  applySourcesRecalculate,
  getSourcesRecalculatePreview,
} from "../api/sourceBalanceApi";

export function useSourcesRecalculatePreview(enabled: boolean) {
  return useQuery({
    queryKey: [...sourceKeys.all, "recalculate-preview"] as const,
    queryFn: getSourcesRecalculatePreview,
    enabled,
    staleTime: 0,
  });
}

export function useApplySourcesRecalculate() {
  const qc = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (sourceIds: string[]) => applySourcesRecalculate(sourceIds),
    onSuccess: (results) => {
      void qc.invalidateQueries({ queryKey: sourceKeys.all });
      const changed = results.filter((r) => r.applied).length;
      addToast({
        type: "success",
        title: "Đã áp dụng reCal",
        message:
          changed > 0
            ? `Cập nhật số dư cho ${String(changed)} nguồn.`
            : "Không có thay đổi số dư.",
      });
    },
    onError: (e) => {
      addToast({
        type: "error",
        title: "Không áp dụng được reCal",
        message: getFinanceApiErrorMessage(e),
      });
    },
  });
}
