import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTranslations } from "@/i18n/hooks";
import { useToastStore } from "@/shared/stores/toastStore";

import { budgetKeys } from "../api/budgetKeys";
import { getCategoryBudgets, upsertCategoryBudget } from "../api/budgetsApi";
import { invalidateBudgetAwareness } from "../lib/invalidateBudgetAwareness";
import type { UpsertCategoryBudgetInput } from "../types";

export function useCategoryBudgets(year?: number, month?: number) {
  return useQuery({
    queryKey: budgetKeys.list(year, month),
    queryFn: () => getCategoryBudgets(year, month),
    staleTime: 20_000,
  });
}

export function useUpsertCategoryBudget() {
  const t = useTranslations("budgets");
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  return useMutation({
    mutationFn: (input: UpsertCategoryBudgetInput) => upsertCategoryBudget(input),
    onSuccess: () => {
      void invalidateBudgetAwareness(queryClient);
      addToast({ type: "success", title: t("saveSuccess") });
    },
    onError: (error: Error) => {
      addToast({ type: "error", title: t("saveError"), message: error.message });
    },
  });
}
