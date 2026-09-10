import { ArrowRight, ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { CategorySelector } from "@/features/categories/components/CategorySelector";
import { useTags } from "@/features/tags/hooks/useTags";
import { useTranslations } from "@/i18n/hooks";
import { AsyncStateError } from "@/shared/components/ui/AsyncStateError";
import { Button } from "@/shared/components/ui/Button";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Modal } from "@/shared/components/ui/Modal";
import { SkeletonCard } from "@/shared/components/ui/Skeleton";

import { useClassificationRuleMutations, useClassificationRules } from "../hooks/useClassificationRules";
import type { ClassificationRule, ClassificationRuleInput } from "../types";

const emptyInput: ClassificationRuleInput = {
  keyword: "", categoryId: "", tagId: null, isActive: true,
};

export function ClassificationRulesPanel() {
  const t = useTranslations("classificationRules");
  const rules = useClassificationRules();
  const mutations = useClassificationRuleMutations();
  const [editing, setEditing] = useState<ClassificationRule | null | undefined>();
  const [removing, setRemoving] = useState<ClassificationRule | null>(null);
  const [input, setInput] = useState<ClassificationRuleInput>(emptyInput);
  const [errors, setErrors] = useState<{ keyword?: string; categoryId?: string }>({});
  const busy = mutations.create.isPending || mutations.update.isPending;

  useEffect(() => {
    if (editing === undefined) return;
    setInput(editing ? {
      keyword: editing.keyword,
      categoryId: editing.categoryId,
      tagId: editing.tagId,
      isActive: editing.isActive,
    } : emptyInput);
    setErrors({});
  }, [editing]);

  const closeEditor = () => { if (!busy) setEditing(undefined); };
  const save = async () => {
    const nextErrors = {
      keyword: input.keyword.trim() ? undefined : t("keywordRequired"),
      categoryId: input.categoryId ? undefined : t("categoryRequired"),
    };
    setErrors(nextErrors);
    if (nextErrors.keyword || nextErrors.categoryId) return;
    const payload = { ...input, keyword: input.keyword.trim() };
    try {
      if (editing) await mutations.update.mutateAsync({ id: editing.id, input: payload });
      else await mutations.create.mutateAsync(payload);
      setEditing(undefined);
    } catch { /* toast is emitted by the mutation */ }
  };

  if (rules.isLoading && !rules.data) return <SkeletonCard lines={6} className="p-8" />;

  return (
    <section className="rounded-card border border-warm-200 bg-surface shadow-sm">
      <div className="flex flex-col gap-4 border-b border-warm-200 p-4 sm:flex-row sm:items-start sm:justify-between md:p-6">
        <div>
          <h2 className="font-display text-lg font-semibold text-warm-900">{t("title")}</h2>
          <p className="mt-1 max-w-2xl text-sm text-warm-600">{t("description")}</p>
          <p className="mt-2 text-xs text-warm-500">{t("matchingHelp")}</p>
        </div>
        <Button className="self-start" leftIcon={<Plus className="size-4" aria-hidden />} onClick={() => setEditing(null)}>
          {t("add")}
        </Button>
      </div>

      {rules.isError ? (
        <div className="p-4 md:p-6">
          <AsyncStateError title={t("loadError")} onRetry={() => void rules.refetch()} />
        </div>
      ) : !rules.data?.length ? (
        <div className="p-6">
          <EmptyState icon={<ListChecks aria-hidden />} title={t("empty")} description={t("emptyHint")} />
        </div>
      ) : (
        <ul className="divide-y divide-warm-100" aria-label={t("listLabel")}>
          {rules.data.map((rule) => (
            <li key={rule.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="max-w-full break-all rounded-md bg-warm-100 px-2 py-1 font-mono text-sm font-semibold text-warm-900">{rule.keyword}</span>
                  <ArrowRight className="size-4 shrink-0 text-warm-400" aria-hidden />
                  <span className="min-w-0 break-words text-sm font-medium text-warm-900">{rule.categoryName}</span>
                  {rule.tagName ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-warm-200 px-2 py-0.5 text-xs text-warm-700">
                      <span className="size-2 rounded-full" style={{ backgroundColor: rule.tagColor ?? undefined }} aria-hidden />
                      {rule.tagName}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-xs text-warm-500">{rule.isActive ? t("active") : t("inactive")}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" leftIcon={<Pencil className="size-3.5" aria-hidden />} onClick={() => setEditing(rule)}>
                  {t("edit")}
                </Button>
                <Button variant="ghost" size="sm" leftIcon={<Trash2 className="size-3.5" aria-hidden />} onClick={() => setRemoving(rule)}>
                  {t("delete")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal isOpen={editing !== undefined} onClose={closeEditor} title={editing ? t("editTitle") : t("createTitle")} description={t("formHint")}>
        <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void save(); }} noValidate>
          <div>
            <label htmlFor="classification-keyword" className="mb-1.5 block text-sm font-medium text-warm-800">{t("keyword")}</label>
            <input id="classification-keyword" value={input.keyword} maxLength={120} disabled={busy}
              onChange={(event) => setInput((value) => ({ ...value, keyword: event.target.value }))}
              aria-invalid={Boolean(errors.keyword)} aria-describedby={errors.keyword ? "classification-keyword-error" : "classification-keyword-help"}
              className="h-10 w-full rounded-input border border-warm-200 bg-warm-50 px-3 text-sm outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25" />
            <p id="classification-keyword-help" className="mt-1 text-xs text-warm-500">{t("keywordHelp")}</p>
            {errors.keyword ? <p id="classification-keyword-error" className="mt-1 text-sm text-danger" role="alert">{errors.keyword}</p> : null}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-warm-800">{t("category")}</label>
            <CategorySelector kind="expense" value={input.categoryId || undefined}
              onChange={(categoryId) => setInput((value) => ({ ...value, categoryId: categoryId ?? "" }))}
              disabled={busy} placeholder={t("categoryPlaceholder")} error={errors.categoryId} ariaLabel={t("category")} />
          </div>
          <TagSelect value={input.tagId} onChange={(tagId) => setInput((value) => ({ ...value, tagId }))} disabled={busy} />
          <label className="flex min-h-11 items-center gap-3 rounded-input border border-warm-200 bg-warm-25 px-3 text-sm text-warm-800">
            <input type="checkbox" checked={input.isActive} disabled={busy} onChange={(event) => setInput((value) => ({ ...value, isActive: event.target.checked }))} />
            {t("enabled")}
          </label>
          <div className="flex justify-end gap-2 border-t border-warm-100 pt-4">
            <Button variant="ghost" onClick={closeEditor} disabled={busy}>{t("cancel")}</Button>
            <Button type="submit" isLoading={busy}>{t("save")}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={removing !== null} onClose={() => setRemoving(null)} title={t("deleteTitle")} description={t("deleteConfirm", { keyword: removing?.keyword ?? "" })} size="sm">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRemoving(null)} disabled={mutations.remove.isPending}>{t("cancel")}</Button>
          <Button variant="danger" isLoading={mutations.remove.isPending} onClick={async () => {
            if (!removing) return;
            try { await mutations.remove.mutateAsync(removing.id); setRemoving(null); } catch { /* toast handles it */ }
          }}>{t("delete")}</Button>
        </div>
      </Modal>
    </section>
  );
}

function TagSelect({ value, onChange, disabled }: { value: string | null; onChange: (id: string | null) => void; disabled: boolean }) {
  const t = useTranslations("classificationRules");
  const tags = useTags();
  return (
    <div>
      <label htmlFor="classification-tag" className="mb-1.5 block text-sm font-medium text-warm-800">{t("tag")}</label>
      <select id="classification-tag" value={value ?? ""} disabled={disabled || tags.isLoading || tags.isError}
        onChange={(event) => onChange(event.target.value || null)}
        className="h-10 w-full rounded-input border border-warm-200 bg-warm-50 px-3 text-sm outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25">
        <option value="">{t("noTag")}</option>
        {(tags.data ?? []).map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
      </select>
      {tags.isError ? <p className="mt-1 text-sm text-danger" role="alert">{t("tagsLoadError")}</p> : null}
    </div>
  );
}
