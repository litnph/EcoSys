"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { AuthLogo, RedirectIfAuthenticated, VerifyEmailHandler } from "@/features/auth/components";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const t = useTranslations("auth");

  return token ? (
    <VerifyEmailHandler token={token} />
  ) : (
    <p className="text-sm text-danger">{t("verifyEmailMissingToken")}</p>
  );
}

export default function VerifyEmailPage() {
  const t = useTranslations("auth");

  return (
    <>
      <RedirectIfAuthenticated />
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-warm-50 p-6">
        <AuthLogo />
        <div className="w-full max-w-md rounded-card border border-warm-200 bg-warm-25 p-6 shadow-sm">
          <h1 className="mb-2 font-display text-xl font-semibold text-warm-900">
            {t("verifyEmailTitle")}
          </h1>
          <Suspense fallback={<p className="text-sm text-warm-600">…</p>}>
            <VerifyEmailContent />
          </Suspense>
        </div>
      </div>
    </>
  );
}
