import { useEffect, useRef, useState } from "react";

import { MoneySourceSelect } from "@/features/sources/components";
import { useSources } from "@/features/sources/hooks";
import {
  IMAGE_IMPORT_KIND_DEFINITIONS,
  resolveImageImportTypeSettings,
} from "@/features/transactions/imageImport/types";
import type { ImageImportTypeSetting } from "@/features/transactions/imageImport/types";
import { useTranslations } from "@/i18n/hooks";
import { AsyncStateError } from "@/shared/components/ui/AsyncStateError";
import { Button } from "@/shared/components/ui/Button";
import { SkeletonCard } from "@/shared/components/ui/Skeleton";
import { cn } from "@/shared/lib/utils";

import {
  useImageImportTypeSettings,
  useUpdateImageImportTypeSettings,
} from "../hooks/useImageImportSettings";

function settingsAreEqual(
  left: readonly ImageImportTypeSetting[],
  right: readonly ImageImportTypeSetting[],
): boolean {
  return left.length === right.length && left.every((setting, index) => {
    const other = right[index];
    return setting.type === other?.type
      && setting.displayName === other.displayName
      && setting.sourceId === other.sourceId;
  });
}

export function ImageImportSettingsPanel() {
  const t = useTranslations("settings");
  const settingsQuery = useImageImportTypeSettings();
  const sourcesQuery = useSources();
  const update = useUpdateImageImportTypeSettings();
  const [settings, setSettings] = useState<ImageImportTypeSetting[]>(() =>
    resolveImageImportTypeSettings([], (labelKey) => t(labelKey)),
  );
  const [savedSettings, setSavedSettings] = useState<ImageImportTypeSetting[]>(settings);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (!settingsQuery.data || dirtyRef.current) return;
    const resolved = resolveImageImportTypeSettings(
      settingsQuery.data,
      (labelKey) => t(labelKey),
    );
    setSettings(resolved);
    setSavedSettings(resolved);
  }, [settingsQuery.data, t]);

  const hasInvalidName = settings.some((setting) => !setting.displayName.trim());
  const hasChanges = !settingsAreEqual(settings, savedSettings);

  const updateSetting = (
    type: ImageImportTypeSetting["type"],
    next: Partial<ImageImportTypeSetting>,
  ) => {
    if (update.isError || update.isSuccess) update.reset();
    dirtyRef.current = true;
    setSettings((current) => current.map((setting) =>
      setting.type === type ? { ...setting, ...next } : setting,
    ));
  };

  const saveSettings = () => {
    if (!hasChanges || hasInvalidName) return;
    const normalized = settings.map((setting) => ({
      ...setting,
      displayName: setting.displayName.trim(),
    }));
    update.mutate(
      normalized,
      {
        onSuccess: (persistedSettings) => {
          const persisted = resolveImageImportTypeSettings(
            persistedSettings,
            (labelKey) => t(labelKey),
          );
          dirtyRef.current = false;
          setSettings(persisted);
          setSavedSettings(persisted);
        },
      },
    );
  };

  if (settingsQuery.isLoading && !settingsQuery.data) {
    return <SkeletonCard lines={5} className="p-8" />;
  }

  return (
    <div className="space-y-6">
      {settingsQuery.isError ? (
        <AsyncStateError
          title={t("loadError")}
          onRetry={() => void settingsQuery.refetch()}
        />
      ) : null}

      <section className="rounded-card border border-warm-200 bg-surface p-4 md:p-6">
        <h2 className="font-display text-lg font-semibold text-warm-900">
          {t("imageImportTypesTitle")}
        </h2>
        <p className="mt-1 text-sm text-warm-600">
          {t("imageImportTypesHelp")}
        </p>

        <div className="mt-6 divide-y divide-warm-200 rounded-card border border-warm-200">
          {IMAGE_IMPORT_KIND_DEFINITIONS.map((definition) => {
            const setting = settings.find((entry) => entry.type === definition.type);
            if (!setting) return null;
            const inputId = `image-import-name-${definition.type}`;
            const sourceId = `image-import-source-${definition.type}`;
            const nameIsEmpty = !setting.displayName.trim();

            return (
              <div
                key={definition.type}
                className="grid min-w-0 gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(14rem,1fr)] sm:items-end sm:p-4"
              >
                <div className="min-w-0">
                  <label
                    htmlFor={inputId}
                    className="mb-1 block text-xs font-medium text-warm-700"
                  >
                    {t("imageImportDisplayName", {
                      type: definition.type === "tp" ? "TP" : t(definition.labelKey),
                    })}
                  </label>
                  <input
                    id={inputId}
                    type="text"
                    maxLength={80}
                    value={setting.displayName}
                    disabled={update.isPending}
                    aria-invalid={nameIsEmpty || undefined}
                    aria-describedby={nameIsEmpty ? `${inputId}-error` : undefined}
                    className={cn(
                      "h-11 w-full min-w-0 rounded-input border bg-warm-50 px-3 text-sm text-warm-900 outline-none",
                      "focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25",
                      nameIsEmpty ? "border-danger" : "border-warm-200",
                    )}
                    onChange={(event) => updateSetting(definition.type, {
                      displayName: event.target.value,
                    })}
                  />
                  {nameIsEmpty ? (
                    <p id={`${inputId}-error`} className="mt-1 text-xs text-danger" role="alert">
                      {t("imageImportDisplayNameRequired")}
                    </p>
                  ) : null}
                </div>
                <MoneySourceSelect
                  id={sourceId}
                  sources={sourcesQuery.data ?? []}
                  value={setting.sourceId ?? ""}
                  label={t("imageImportMoneySource")}
                  placeholder={t("imageImportNoMoneySource")}
                  emptyLabel={t("imageImportNoMoneySource")}
                  disabled={update.isPending || sourcesQuery.isLoading || sourcesQuery.isError}
                  onChange={(nextSourceId) => updateSetting(definition.type, {
                    sourceId: nextSourceId || null,
                  })}
                />
              </div>
            );
          })}
        </div>

        {sourcesQuery.isError ? (
          <p className="mt-2 text-sm text-danger" role="alert">
            {t("imageImportSourcesLoadError")}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-warm-200 pt-4">
          <p className="min-h-5 text-sm text-warm-600" aria-live="polite">
            {update.isPending
              ? t("savingPreferences")
              : update.isError
                ? t("preferencesSaveError")
                : update.isSuccess
                  ? t("preferencesSaved")
                  : hasChanges
                    ? t("imageImportUnsavedChanges")
                    : null}
          </p>
          <Button
            type="button"
            isLoading={update.isPending}
            disabled={!hasChanges || hasInvalidName || settingsQuery.isError}
            onClick={saveSettings}
          >
            {t("saveImageImportSettings")}
          </Button>
        </div>
      </section>
    </div>
  );
}
