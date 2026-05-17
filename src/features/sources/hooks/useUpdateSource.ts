"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToastStore } from "@/shared/stores/toastStore";

import { sourceKeys } from "../api/sourceKeys";
import { updateSource } from "../api/sourcesApi";
import { getFinanceApiErrorMessage } from "../utils/apiError";
import type { FinSource, UpdateSourceRequest } from "../types";

type UpdateVars = {
  id: string;
  smoduleId: string;
  body: UpdateSourceRequest;
};

export function useUpdateSource() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ id, body }: UpdateVars) => updateSource(id, body),
    onMutate: async (variables) => {
      const listKey = sourceKeys.list(variables.smoduleId);
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<FinSource[]>(listKey);

      queryClient.setQueryData<FinSource[]>(listKey, (old) => {
        if (!old) return old;
        return old.map((row) => {
          if (row.id !== variables.id) return row;
          const b = variables.body;
          const merged: FinSource = {
            ...row,
            name: b.name,
            type: b.type,
            currency: b.currency ?? row.currency,
            icon: b.icon ?? null,
            color: b.color ?? null,
            sortOrder: b.sortOrder ?? row.sortOrder,
            creditLimit:
              b.type === "creditCard" ? b.creditLimit ?? null : null,
            statementDay:
              b.type === "creditCard" ? b.statementDay ?? null : null,
            paymentDueDay:
              b.type === "creditCard" ? b.paymentDueDay ?? null : null,
            minInstallmentAmt:
              b.type === "creditCard" ? b.minInstallmentAmt ?? null : null,
          };
          return merged;
        });
      });

      return { previous, listKey };
    },
    onError: (error, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(context.listKey, context.previous);
      }
      addToast({
        type: "error",
        title: "Cập nhật thất bại",
        message: getFinanceApiErrorMessage(error),
      });
    },
    onSuccess: (server, variables) => {
      queryClient.setQueryData<FinSource[]>(
        sourceKeys.list(variables.smoduleId),
        (old) => {
          if (!old) return [server];
          return old.map((r) => (r.id === server.id ? server : r));
        },
      );
      queryClient.setQueryData(sourceKeys.detail(server.id), server);
      addToast({
        type: "success",
        title: "Đã cập nhật nguồn",
      });
    },
  });
}
