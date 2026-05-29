import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en.json";
import vi from "./vi.json";
import { routing } from "./routing";

type MessageBundle = Record<string, unknown>;

/** Mỗi key cấp 1 trong JSON (auth, transaction, …) là một namespace i18next. */
function bundleToNamespaces(
  bundle: MessageBundle): Record<string, MessageBundle> {
  const namespaces: Record<string, MessageBundle> = {};
  for (const [key, value] of Object.entries(bundle)) {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      namespaces[key] = value as MessageBundle;
    }
  }
  return namespaces;
}

const viNamespaces = bundleToNamespaces(vi as MessageBundle);

void i18n.use(initReactI18next).init({
  resources: {
    en: bundleToNamespaces(en as MessageBundle),
    vi: viNamespaces,
  },
  lng: routing.defaultLocale,
  fallbackLng: routing.defaultLocale,
  supportedLngs: [...routing.locales],
  ns: Object.keys(viNamespaces),
  defaultNS: "common",
  interpolation: { escapeValue: false },
});

export default i18n;
