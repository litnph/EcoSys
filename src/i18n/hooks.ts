import { useTranslation } from "react-i18next";

import { useLocale } from "./navigation";

/** Drop-in for next-intl `useTranslations(namespace)`. */
export function useTranslations(namespace?: string) {
  const { t } = useTranslation(namespace);
  return t;
}

export { useLocale };
