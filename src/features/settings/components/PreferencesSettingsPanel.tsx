import { useEffect, useRef, useState } from "react";

import { useTranslations } from "@/i18n/hooks";
import { useLocale } from "@/i18n/navigation";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useTheme } from "@/shared/providers/theme-provider";

import type {
  DateFormatPreference,
  FirstDayOfWeekPreference,
  ThemePreference,
  TimeFormatPreference,
  UserPreferencesDto,
} from "../types";
import {
  readClientPreferences,
  writeClientPreferences,
} from "../utils/clientPreferences";
import { usePatchPreferences, usePreferencesQuery } from "../hooks/useSettingsQueries";
import { TimezoneSelect } from "./TimezoneSelect";

import { SkeletonCard } from "@/shared/components/ui/Skeleton";

const fieldsetClass =
  "rounded-card border border-warm-200 bg-warm-25/80 p-4 md:p-5";

function RadioRow({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((o) => (
        <label
          key={o.value}
          className="flex cursor-pointer items-center gap-2 text-sm text-warm-800"
        >
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="size-4 border-warm-300 text-accent focus:ring-accent"
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}

const defaultPreferences: UserPreferencesDto = {
  languageCode: "vi",
  timezone: "Asia/Ho_Chi_Minh",
  dateFormat: "dd/MM/yyyy",
  timeFormat: "24h",
  theme: "system",
  firstDayOfWeek: "monday",
  ...readClientPreferences(),
};

export function PreferencesSettingsPanel() {
  const { setTheme: applyRootTheme } = useTheme();
  const t = useTranslations("settings");
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const prefsQuery = usePreferencesQuery();
  const patch = usePatchPreferences();

  const server = prefsQuery.data;
  const [local, setLocal] = useState<UserPreferencesDto>(defaultPreferences);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (server && !dirtyRef.current) {
      setLocal({ ...server, ...readClientPreferences() });
      applyRootTheme(server.theme);
    }
  }, [server, applyRootTheme]);

  useEffect(() => {
    if (!dirtyRef.current) return;
    const timer = window.setTimeout(() => {
      patch.mutate(
        {
          languageCode: local.languageCode,
          timezone: local.timezone,
          dateFormat: local.dateFormat,
          theme: local.theme,
        },
        {
          onSuccess: () => {
            dirtyRef.current = false;
          },
        },
      );
    }, 500);
    return () => window.clearTimeout(timer);
  }, [
    local.languageCode,
    local.timezone,
    local.dateFormat,
    local.theme,
    patch,
  ]);

  const bump = (partial: Partial<UserPreferencesDto>) => {
    if (
      partial.timeFormat !== undefined ||
      partial.firstDayOfWeek !== undefined
    ) {
      setLocal((prev) => {
        const merged = { ...prev, ...partial };
        writeClientPreferences({
          timeFormat: merged.timeFormat,
          firstDayOfWeek: merged.firstDayOfWeek,
        });
        return merged;
      });
      return;
    }

    dirtyRef.current = true;
    setLocal((prev) => {
      const merged = { ...prev, ...partial };
      if (partial.theme) {
        applyRootTheme(partial.theme as ThemePreference);
      }
      return merged;
    });
  };

  if (prefsQuery.isLoading && !prefsQuery.data) {
    return <SkeletonCard lines={6} className="p-8" />;
  }

  return (
    <div className="space-y-6">
      {prefsQuery.isError ? (
        <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warm-800">
          {t("loadError")}
        </p>
      ) : null}

      <section className="rounded-card border border-warm-200 bg-surface p-4 shadow-sm md:p-6">
        <h2 className="font-display text-lg font-semibold text-warm-900">
          {t("preferencesTitle")}
        </h2>
        <p className="mt-1 text-sm text-warm-600">{t("preferencesHint")}</p>

        <div className="mt-8 space-y-6">
          <div className={fieldsetClass}>
            <div className="text-sm font-medium text-warm-900">{t("language")}</div>
            <select
              value={local.languageCode}
              onChange={(e) => {
                const code = e.target.value as "vi" | "en";
                bump({ languageCode: code });
                if (code !== locale) {
                  router.replace(pathname, { locale: code, preserveSearch: true });
                }
              }}
              className="mt-3 h-10 w-full max-w-xs rounded-input border border-warm-200 bg-surface px-3 text-sm text-warm-900 outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25"
            >
              <option value="vi">{t("langVi")}</option>
              <option value="en">{t("langEn")}</option>
            </select>
          </div>

          <div className={fieldsetClass}>
            <div className="text-sm font-medium text-warm-900">{t("timezone")}</div>
            <div className="mt-3 max-w-md">
              <TimezoneSelect
                value={local.timezone}
                onChange={(tz) => bump({ timezone: tz })}
                disabled={patch.isPending}
              />
            </div>
          </div>

          <div className={fieldsetClass}>
            <div className="text-sm font-medium text-warm-900">{t("dateFormat")}</div>
            <div className="mt-3">
              <RadioRow
                name="dateFmt"
                value={local.dateFormat}
                onChange={(v) => bump({ dateFormat: v as DateFormatPreference })}
                options={[
                  { value: "dd/MM/yyyy", label: t("dateFmtDMY") },
                  { value: "MM/dd/yyyy", label: t("dateFmtMDY") },
                ]}
              />
            </div>
          </div>

          <div className={fieldsetClass}>
            <div className="text-sm font-medium text-warm-900">{t("timeFormat")}</div>
            <div className="mt-3">
              <RadioRow
                name="timeFmt"
                value={local.timeFormat}
                onChange={(v) => bump({ timeFormat: v as TimeFormatPreference })}
                options={[
                  { value: "24h", label: t("time24") },
                  { value: "12h", label: t("time12") },
                ]}
              />
            </div>
          </div>

          <div className={fieldsetClass}>
            <div className="text-sm font-medium text-warm-900">{t("theme")}</div>
            <div className="mt-3">
              <RadioRow
                name="theme"
                value={local.theme}
                onChange={(v) => bump({ theme: v as ThemePreference })}
                options={[
                  { value: "light", label: t("themeLight") },
                  { value: "dark", label: t("themeDark") },
                  { value: "system", label: t("themeSystem") },
                ]}
              />
            </div>
          </div>

          <div className={fieldsetClass}>
            <div className="text-sm font-medium text-warm-900">{t("weekStart")}</div>
            <div className="mt-3">
              <RadioRow
                name="weekStart"
                value={local.firstDayOfWeek}
                onChange={(v) => bump({ firstDayOfWeek: v as FirstDayOfWeekPreference })}
                options={[
                  { value: "monday", label: t("weekMon") },
                  { value: "sunday", label: t("weekSun") },
                ]}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
