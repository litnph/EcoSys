"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";

import { AuthCallbackHandler, AuthLogo } from "@/features/auth/components";

export default function AuthCallbackPage() {
  const t = useTranslations("auth");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-warm-50 p-6">
      <AuthLogo />
      <div className="w-full max-w-md rounded-card border border-warm-200 bg-warm-25 p-6 shadow-sm">
        <h1 className="mb-4 font-display text-xl font-semibold text-warm-900">
          {t("oauthCallbackTitle")}
        </h1>
        <Suspense fallback={<p className="text-sm text-warm-600">…</p>}>
          <AuthCallbackHandler />
        </Suspense>
      </div>
    </div>
  );
}
