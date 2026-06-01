import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToastStore } from "@/shared/stores/toastStore";

import { invalidateDashboard } from "@/features/dashboard/lib/invalidateDashboard";

import { sourceKeys } from "../api/sourceKeys";
import { deleteSource } from "../api/sourcesApi";
import { getFinanceApiErrorMessage } from "../utils/apiError";
import type { FinSource } from "../types";

type DeleteVars = {
  id: string;
};

export function useDeleteSource() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ id }: DeleteVars) => deleteSource(id),
    onMutate: async (variables) => {
      const listKey = sourceKeys.list();
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<FinSource[]>(listKey);

      queryClient.setQueryData<FinSource[]>(listKey, (old) =>
        old ? old.filter((s) => s.id !== variables.id) : old);

      return { previous, listKey };
    },
    onError: (error, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(context.listKey, context.previous);
      }
      addToast({
        type: "error",
        title: "Không xóa được nguồn",
        message: getFinanceApiErrorMessage(error),
      });
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: sourceKeys.lists() });
      void queryClient.removeQueries({
        queryKey: sourceKeys.detail(variables.id),
      });
      void queryClient.removeQueries({
        queryKey: sourceKeys.txCount( variables.id),
      });
      invalidateDashboard(queryClient);
      addToast({
        type: "success",
        title: "Đã xóa nguồn",
      });
    },
  });
}
