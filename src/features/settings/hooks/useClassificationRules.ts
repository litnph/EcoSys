import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTranslations } from "@/i18n/hooks";
import { useToastStore } from "@/shared/stores/toastStore";

import {
  createClassificationRule,
  deleteClassificationRule,
  getClassificationRules,
  updateClassificationRule,
} from "../api/classificationRulesApi";
import { settingsKeys } from "../api/settingsKeys";
import type { ClassificationRuleInput } from "../types";

export function useClassificationRules() {
  return useQuery({
    queryKey: settingsKeys.classificationRules(),
    queryFn: getClassificationRules,
    staleTime: 30_000,
  });
}

export function useClassificationRuleMutations() {
  const client = useQueryClient();
  const toast = useToastStore((state) => state.addToast);
  const t = useTranslations("classificationRules");
  const invalidate = () => client.invalidateQueries({ queryKey: settingsKeys.classificationRules() });

  const create = useMutation({
    mutationFn: createClassificationRule,
    onSuccess: () => { void invalidate(); toast({ type: "success", title: t("created") }); },
    onError: (error: Error) => toast({ type: "error", title: t("saveError"), message: error.message }),
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ClassificationRuleInput }) => updateClassificationRule(id, input),
    onSuccess: () => { void invalidate(); toast({ type: "success", title: t("updated") }); },
    onError: (error: Error) => toast({ type: "error", title: t("saveError"), message: error.message }),
  });
  const remove = useMutation({
    mutationFn: deleteClassificationRule,
    onSuccess: () => { void invalidate(); toast({ type: "success", title: t("deleted") }); },
    onError: (error: Error) => toast({ type: "error", title: t("deleteError"), message: error.message }),
  });
  return { create, update, remove };
}
