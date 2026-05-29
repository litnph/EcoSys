import { useLocale } from "@/i18n/navigation";
import { useEffect } from "react";

export function DocumentLang() {
  const locale = useLocale();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
