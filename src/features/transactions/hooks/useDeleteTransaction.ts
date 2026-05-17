"use client";

import type { InfiniteData } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { dashboardKeys } from "@/features/dashboard/api/dashboardKeys";
import { sourceKeys } from "@/features/sources/api/sourceKeys";
import { getFinanceApiErrorMessage } from "@/features/sources/utils/apiError";
import { useToastStore } from "@/shared/stores/toastStore";

import { deleteTransaction } from "../api/transactionsApi";
import { transactionKeys } from "../api/transactionKeys";
import type { TransactionsPage } from "../types";

export type DeleteTransactionVariables = {
  id: string;
  reason?: string;
  smoduleId?: string | null;
};

type InfiniteTxnCache = InfiniteData<TransactionsPage>;

export function useDeleteTransaction() {
  const qc = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ id, reason }: DeleteTransactionVariables) =>
      deleteTransaction(id, reason),
    onMutate: async (variables) => {
      await qc.cancelQueries({ queryKey: transactionKeys.all });

      const previousInfinite = qc.getQueriesData<InfiniteTxnCache>({
        queryKey: [...transactionKeys.all, "infinite"],
      });

      qc.setQueriesData<InfiniteTxnCache>(
        { queryKey: [...transactionKeys.all, "infinite"] },
        (old) => {
          if (!old?.pages?.length) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.filter((t) => t.id !== variables.id),
            })),
          };
        },
      );

      return { previousInfinite };
    },
    onError: (error, _variables, context) => {
      if (context?.previousInfinite?.length) {
        for (const [key, data] of context.previousInfinite) {
          if (data !== undefined) {
            qc.setQueryData(key, data);
          }
        }
      }
      addToast({
        type: "error",
        title: "Không xóa được giao dịch",
        message: getFinanceApiErrorMessage(error),
      });
    },
    onSuccess: (_tid, variables) => {
      void qc.invalidateQueries({ queryKey: transactionKeys.lists() });
      void qc.invalidateQueries({ queryKey: transactionKeys.all });
      void qc.removeQueries({
        queryKey: transactionKeys.detail(variables.id),
      });
      void qc.removeQueries({
        queryKey: transactionKeys.history(variables.id),
      });

      void qc.invalidateQueries({ queryKey: sourceKeys.lists() });

      const sid = variables.smoduleId?.trim();
      if (sid) {
        void qc.invalidateQueries({ queryKey: dashboardKeys.summary(sid) });
        void qc.invalidateQueries({
          queryKey: [...dashboardKeys.all, "recentTransactions", sid],
        });
      }

      addToast({
        type: "success",
        title: "Đã xóa giao dịch",
      });
    },
  });
}
