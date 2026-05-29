import { Suspense } from "react";
import { useTranslations } from "@/i18n/hooks";

import {
  AuthLogo,
  LoginForm,
  RedirectIfAuthenticated,
} from "@/features/auth/components";

export function LoginPage() {
  const t = useTranslations("auth");
  return (
    <>
      <RedirectIfAuthenticated />
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-warm-50 p-6">
        <AuthLogo />
        <div className="w-full max-w-md rounded-card border border-warm-200 bg-warm-25 p-6 shadow-sm">
          <h1 className="mb-6 font-display text-xl font-semibold text-warm-900">
            {t("loginTitle")}
          </h1>
          <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-warm-100" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </>
  );
}
