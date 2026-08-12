import type { ReactNode } from "react";

import { useTranslations } from "@/i18n/hooks";

import { ROUTES } from "@/config/routes";
import { Link, usePathname } from "@/i18n/navigation";
import { PageHeader } from "@/shared/components/layouts/PageHeader";
import { cn } from "@/shared/lib/utils";

const TABS: {
  href: string;
  labelKey: "tabProfile" | "tabPreferences";
}[] = [
  { href: ROUTES.dashboard.settingsProfile, labelKey: "tabProfile" },
  { href: ROUTES.dashboard.settingsPreferences, labelKey: "tabPreferences" },
];

export type SettingsSectionLayoutProps = {
  children: ReactNode;
};

export function SettingsSectionLayout({ children }: SettingsSectionLayoutProps) {
  const pathname = usePathname();
  const t = useTranslations("settings");

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader title={t("title")} description={t("description")} />

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <nav
          aria-label={t("sectionsNav")}
          className={cn(
            "flex shrink-0 gap-1 overflow-x-auto rounded-card border border-warm-200 bg-surface p-1",
            "lg:w-52 lg:flex-col lg:overflow-visible")}
        >
          {TABS.map(({ href, labelKey }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none",
                  "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                  active
                    ? "bg-accent/15 text-warm-900"
                    : "text-warm-600 hover:bg-warm-100 hover:text-warm-900")}
              >
                {t(labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
