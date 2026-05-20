"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  AuthLogo,
  RedirectIfAuthenticated,
  ResetPasswordForm,
} from "@/features/auth/components";

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  return (
    <>
      <RedirectIfAuthenticated />
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-warm-50 p-6">
        <AuthLogo />
        <div className="w-full max-w-md rounded-card border border-warm-200 bg-warm-25 p-6 shadow-sm">
          <h1 className="mb-2 font-display text-xl font-semibold text-warm-900">
            {t("resetPasswordTitle")}
          </h1>
          <p className="mb-6 text-sm text-warm-600">{t("resetPasswordSubtitle")}</p>
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <p className="text-sm text-danger">{t("resetPasswordMissingToken")}</p>
          )}
        </div>
      </div>
    </>
  );
}
