import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToastStore } from "@/shared/stores/toastStore";

import { invalidateDashboard } from "@/features/dashboard/lib/invalidateDashboard";

import { sourceKeys } from "../api/sourceKeys";
import { createSource } from "../api/sourcesApi";
import { getFinanceApiErrorMessage } from "../utils/apiError";
import type { CreateSourceRequest } from "../types";

export function useCreateSource() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (data: CreateSourceRequest) => createSource(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sourceKeys.all });
      invalidateDashboard(queryClient);
      addToast({
        type: "success",
        title: "Đã tạo nguồn tài chính",
      });
    },
    onError: (error) => {
      addToast({
        type: "error",
        title: "Không tạo được nguồn",
        message: getFinanceApiErrorMessage(error),
      });
    },
  });
}
