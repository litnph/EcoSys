"use client";

import { useTranslations } from "next-intl";

import {
  AuthLogo,
  RegisterForm,
  RedirectIfAuthenticated,
} from "@/features/auth/components";

export default function RegisterPage() {
  const t = useTranslations("auth");
  return (
    <>
      <RedirectIfAuthenticated />
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-warm-50 p-6">
        <AuthLogo />
        <div className="w-full max-w-md rounded-card border border-warm-200 bg-warm-25 p-6 shadow-sm">
          <h1 className="mb-6 font-display text-xl font-semibold text-warm-900">
            {t("registerTitle")}
          </h1>
          <RegisterForm />
        </div>
      </div>
    </>
  );
}
