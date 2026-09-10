import { Suspense } from "react";
import { ListChecks, ShieldCheck, UsersRound } from "lucide-react";
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
      <main className="grid min-h-screen min-h-[100dvh] bg-background lg:grid-cols-[minmax(360px,0.88fr)_minmax(520px,1.12fr)]">
        <aside className="hidden border-r border-warm-200 bg-warm-900 px-10 py-12 text-warm-25 lg:flex lg:flex-col lg:justify-between xl:px-16 xl:py-16">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-button bg-warm-25 text-sm font-bold tracking-[-0.03em] text-warm-900">ES</span>
            <span className="text-xl font-bold tracking-[-0.025em]">EcoSys</span>
          </div>

          <div className="max-w-lg">
            <h1 className="max-w-[18ch] text-3xl font-semibold leading-tight tracking-[-0.03em] xl:text-4xl">
              {t("trustTitle")}
            </h1>
            <p className="mt-5 max-w-[58ch] text-sm leading-6 text-warm-300">
              {t("trustDescription")}
            </p>
            <ul className="mt-9 space-y-4 border-t border-warm-700 pt-6 text-sm text-warm-200">
              <li className="flex items-center gap-3"><ShieldCheck className="size-5 shrink-0 text-accent" aria-hidden />{t("trustPrivate")}</li>
              <li className="flex items-center gap-3"><ListChecks className="size-5 shrink-0 text-accent" aria-hidden />{t("trustTraceable")}</li>
              <li className="flex items-center gap-3"><UsersRound className="size-5 shrink-0 text-accent" aria-hidden />{t("trustClear")}</li>
            </ul>
          </div>

          <p className="text-xs text-warm-400">EcoSys · {new Date().getFullYear()}</p>
        </aside>

        <section className="flex min-h-[100dvh] items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-[440px]">
            <div className="mb-10 lg:hidden"><AuthLogo /></div>
            <div className="border-b border-warm-200 pb-5">
              <h1 className="font-display text-[1.75rem] font-semibold tracking-[-0.03em] text-warm-900">
                {t("loginTitle")}
              </h1>
              <p className="mt-2 text-sm leading-6 text-warm-500">{t("loginSubtitle")}</p>
            </div>
            <Suspense fallback={<div className="mt-6 h-48 animate-pulse rounded-card bg-warm-100 motion-reduce:animate-none" />}>
              <div className="mt-6"><LoginForm /></div>
            </Suspense>
          </div>
        </section>
      </main>
    </>
  );
}
