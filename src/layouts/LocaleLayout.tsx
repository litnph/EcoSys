import { useEffect } from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";
import { I18nextProvider } from "react-i18next";

import { SessionManager } from "@/features/auth/components/SessionManager";
import i18n from "@/i18n";
import { routing, type AppLocale } from "@/i18n/routing";
import { DocumentLang } from "@/shared/components/DocumentLang";
import { PageTransition } from "@/shared/components/layouts/PageTransition";

function isAppLocale(value: string | undefined): value is AppLocale {
  return (
    value != null &&
    (routing.locales as readonly string[]).includes(value)
  );
}

export function LocaleLayout() {
  const { locale } = useParams<{ locale: string }>();

  useEffect(() => {
    if (isAppLocale(locale) && i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [locale]);

  if (!isAppLocale(locale)) {
    return <Navigate to={`/${routing.defaultLocale}`} replace />;
  }

  return (
    <I18nextProvider i18n={i18n}>
      <DocumentLang />
      <SessionManager />
      <Outlet />
    </I18nextProvider>
  );
}

export function AuthLayout() {
  return (
    <PageTransition>
      <Outlet />
    </PageTransition>
  );
}
