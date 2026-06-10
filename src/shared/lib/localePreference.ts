import { LOCALE_KEY } from "@/config/constants";
import i18n from "@/i18n";
import { routing, type AppLocale } from "@/i18n/routing";

export function normalizeAppLocale(code?: string | null): AppLocale {
  return code === "en" ? "en" : "vi";
}

export function setPreferredLocale(locale: AppLocale): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    /* ignore */
  }
}

export function applyAccountLocale(languageCode?: string | null): AppLocale {
  const locale = normalizeAppLocale(languageCode);
  setPreferredLocale(locale);
  if (i18n.language !== locale) {
    void i18n.changeLanguage(locale);
  }
  return locale;
}

export function isAppLocale(value: string | undefined): value is AppLocale {
  return (
    value != null &&
    (routing.locales as readonly string[]).includes(value)
  );
}
