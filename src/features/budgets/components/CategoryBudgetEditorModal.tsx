import { AlertTriangle, Gauge } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { FinCategory } from "@/features/categories/types";
import { useSources } from "@/features/sources/hooks/useSources";
import { useTranslations } from "@/i18n/hooks";
import {
  AsyncStateError,
  Button,
  CurrencyInput,
  Modal,
  SkeletonText,
} from "@/shared/components/ui";

import { useCategoryBudgets, useUpsertCategoryBudget } from "../hooks/useBudgets";
import type { BudgetTargetMode } from "../types";
import { generateBudgetThresholds, validateBudgetThresholds } from "../utils/thresholds";

interface EditorState {
  enabled: boolean;
  amount: number;
  targetMode: BudgetTargetMode;
  currency: string;
  warningCount: number;
  thresholds: number[];
}

interface CategoryBudgetEditorModalProps {
  category: FinCategory;
  isOpen: boolean;
  onClose: () => void;
}

export function CategoryBudgetEditorModal({
  category,
  isOpen,
  onClose,
}: CategoryBudgetEditorModalProps) {
  const t = useTranslations("budgets");
  const budgetsQuery = useCategoryBudgets();
  const sourcesQuery = useSources();
  const save = useUpsertCategoryBudget();
  const [editor, setEditor] = useState<EditorState | null>(null);

  const currencies = useMemo(() => {
    const values = new Set((sourcesQuery.data ?? []).map((source) => source.currency));
    values.add("VND");
    return [...values].sort();
  }, [sourcesQuery.data]);

  const budget = useMemo(
    () => budgetsQuery.data?.items.find((item) => item.categoryId === category.id),
    [budgetsQuery.data?.items, category.id],
  );

  useEffect(() => {
    if (!isOpen || budgetsQuery.isLoading || sourcesQuery.isLoading) return;
    setEditor({
      enabled: budget?.isEnabled ?? true,
      amount: budget?.budgetAmount ?? 0,
      targetMode: budget?.targetMode ?? "maximum",
      currency: budget?.currency ?? currencies[0] ?? "VND",
      warningCount: budget?.warningCount ?? 2,
      thresholds: budget?.warningThresholds ?? generateBudgetThresholds(2),
    });
  }, [budget, budgetsQuery.isLoading, currencies, isOpen, sourcesQuery.isLoading]);

  useEffect(() => {
    if (save.isSuccess) onClose();
  }, [onClose, save.isSuccess]);

  const amountError = editor?.enabled && editor.amount <= 0 ? t("amountError") : null;
  const thresholdsValid = editor
    ? validateBudgetThresholds(editor.thresholds, editor.warningCount)
    : true;
  const loading = (budgetsQuery.isLoading || sourcesQuery.isLoading) && editor === null;
  const loadError = budgetsQuery.isError;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !save.isPending && onClose()}
      title={t("editorTitle", { category: category.name })}
      size="md"
    >
      {loading ? (
        <div className="space-y-4" aria-busy="true">
          <SkeletonText className="h-11 w-full rounded-input" />
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <SkeletonText className="h-16 w-full rounded-input" />
            <SkeletonText className="h-16 w-full rounded-input" />
          </div>
          <SkeletonText className="h-20 w-full rounded-input" />
        </div>
      ) : loadError ? (
        <AsyncStateError
          title={t("loadError")}
          onRetry={() => {
            void budgetsQuery.refetch();
          }}
        />
      ) : editor ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (amountError || !thresholdsValid) return;
            save.mutate({
              categoryId: category.id,
              isEnabled: editor.enabled,
              budgetAmount: editor.amount,
              targetMode: editor.targetMode,
              currency: editor.currency,
              warningCount: editor.warningCount,
              warningThresholds: editor.thresholds,
            });
          }}
          className="space-y-5"
        >
          <label className="flex min-h-11 items-center gap-3 rounded-input bg-warm-50 px-3 text-sm font-medium text-warm-900">
            <input
              type="checkbox"
              checked={editor.enabled}
              onChange={(event) => setEditor({ ...editor, enabled: event.target.checked })}
              className="size-4 rounded border-warm-300 text-accent focus:ring-accent"
            />
            {t("enabled")}
          </label>

          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <CurrencyInput
              id="category-budget-amount"
              value={editor.amount}
              onChange={(amount) => setEditor({ ...editor, amount })}
              currency={editor.currency}
              label={t("amount")}
              error={amountError ?? undefined}
              required={editor.enabled}
              disabled={!editor.enabled || save.isPending}
            />
            <label className="text-sm font-medium text-warm-700">
              {t("currency")}
              <select
                value={editor.currency}
                onChange={(event) => setEditor({ ...editor, currency: event.target.value })}
                disabled={!editor.enabled || save.isPending}
                className="mt-1 h-10 w-full rounded-input border border-warm-200 bg-warm-50 px-3 text-sm text-warm-900 focus-visible:ring-2 focus-visible:ring-accent/25"
              >
                {currencies.map((currency) => (
                  <option key={currency}>{currency}</option>
                ))}
              </select>
            </label>
          </div>

          <fieldset disabled={!editor.enabled || save.isPending}>
            <legend className="text-sm font-medium text-warm-700">
              {t("targetModeLabel")}
            </legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {(["maximum", "minimum"] as const).map((mode) => {
                const selected = editor.targetMode === mode;
                return (
                  <label
                    key={mode}
                    className={`flex cursor-pointer items-start gap-3 rounded-input border p-3 transition-colors focus-within:ring-2 focus-within:ring-accent/25 ${
                      selected
                        ? "border-accent bg-accent/[0.06]"
                        : "border-warm-200 bg-warm-50"
                    } disabled:cursor-not-allowed`}
                  >
                    <input
                      type="radio"
                      name="budget-target-mode"
                      value={mode}
                      checked={selected}
                      onChange={() => setEditor({ ...editor, targetMode: mode })}
                      className="mt-0.5 size-4 border-warm-300 text-accent focus:ring-accent"
                    />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-sm font-semibold text-warm-900">
                        <span aria-hidden>{mode === "maximum" ? "≤" : "≥"}</span>
                        {t(`targetMode.${mode}.label`)}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-warm-500">
                        {t(`targetMode.${mode}.help`)}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label htmlFor="budget-warning-count" className="text-sm font-medium text-warm-700">
              {t("warningCount")}
            </label>
            <p id="budget-warning-count-help" className="mt-1 text-xs text-warm-500">
              {t("warningCountHelp")}
            </p>
            <select
              id="budget-warning-count"
              aria-describedby="budget-warning-count-help"
              value={editor.warningCount}
              disabled={!editor.enabled || save.isPending}
              onChange={(event) => {
                const warningCount = Number(event.target.value);
                setEditor({
                  ...editor,
                  warningCount,
                  thresholds: generateBudgetThresholds(warningCount),
                });
              }}
              className="mt-2 h-10 w-full rounded-input border border-warm-200 bg-warm-50 px-3 text-sm text-warm-900 focus-visible:ring-2 focus-visible:ring-accent/25"
            >
              {Array.from({ length: 11 }, (_, index) => (
                <option key={index} value={index}>
                  {index}
                </option>
              ))}
            </select>
          </div>

          {editor.warningCount > 0 ? (
            <fieldset>
              <legend className="text-sm font-medium text-warm-700">{t("thresholds")}</legend>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {editor.thresholds.map((threshold, index) => (
                  <label key={index} className="text-xs text-warm-600">
                    {t("thresholdLabel", { level: index + 1 })}
                    <span className="relative mt-1 block">
                      <input
                        type="number"
                        min="0.01"
                        max="99.99"
                        step="0.01"
                        value={Number.isFinite(threshold) ? threshold : ""}
                        disabled={!editor.enabled || save.isPending}
                        onChange={(event) => {
                          const thresholds = [...editor.thresholds];
                          thresholds[index] = Number(event.target.value);
                          setEditor({ ...editor, thresholds });
                        }}
                        className="h-10 w-full rounded-input border border-warm-200 bg-warm-50 px-3 pr-8 font-mono text-sm text-warm-900 focus-visible:ring-2 focus-visible:ring-accent/25"
                      />
                      <span className="pointer-events-none absolute right-3 top-2.5">%</span>
                    </span>
                  </label>
                ))}
              </div>
              {!thresholdsValid ? (
                <p className="mt-2 flex items-start gap-2 text-sm text-danger" role="alert">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {t("thresholdError")}
                </p>
              ) : null}
            </fieldset>
          ) : (
            <p className="flex items-start gap-2 rounded-input bg-warm-50 p-3 text-sm text-warm-600">
              <Gauge className="mt-0.5 size-4 shrink-0" aria-hidden />
              {t("noWarningsHelp")}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={save.isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={Boolean(amountError) || !thresholdsValid}
              isLoading={save.isPending}
            >
              {t("save")}
            </Button>
          </div>
        </form>
      ) : null}
    </Modal>
  );
}
