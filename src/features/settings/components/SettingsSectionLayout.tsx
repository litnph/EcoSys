import { motion, useReducedMotion } from "framer-motion";
import {
  ChevronRight,
  Images,
  SlidersHorizontal,
  Tags,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { ROUTES } from "@/config/routes";
import { useTranslations } from "@/i18n/hooks";
import { Link, usePathname } from "@/i18n/navigation";
import { PageHeader } from "@/shared/components/layouts/PageHeader";
import { useIsAdmin } from "@/shared/hooks/useIsAdmin";
import { cn } from "@/shared/lib/utils";

type SettingsTab = {
  href: string;
  labelKey:
    | "tabProfile"
    | "tabPreferences"
    | "tabImageImport"
    | "tabClassification"
    | "tabMembers";
  descriptionKey:
    | "tabProfileDescription"
    | "tabPreferencesDescription"
    | "tabImageImportDescription"
    | "tabClassificationDescription"
    | "tabMembersDescription";
  group: "personal" | "workspace";
  icon: LucideIcon;
  adminOnly?: boolean;
};

const TABS: SettingsTab[] = [
  {
    href: ROUTES.dashboard.settingsProfile,
    labelKey: "tabProfile",
    descriptionKey: "tabProfileDescription",
    group: "personal",
    icon: UserRound,
  },
  {
    href: ROUTES.dashboard.settingsPreferences,
    labelKey: "tabPreferences",
    descriptionKey: "tabPreferencesDescription",
    group: "personal",
    icon: SlidersHorizontal,
  },
  {
    href: ROUTES.dashboard.settingsImageImport,
    labelKey: "tabImageImport",
    descriptionKey: "tabImageImportDescription",
    group: "workspace",
    icon: Images,
    adminOnly: true,
  },
  {
    href: ROUTES.dashboard.settingsClassification,
    labelKey: "tabClassification",
    descriptionKey: "tabClassificationDescription",
    group: "workspace",
    icon: Tags,
  },
  {
    href: ROUTES.dashboard.settingsMembers,
    labelKey: "tabMembers",
    descriptionKey: "tabMembersDescription",
    group: "workspace",
    icon: Users,
    adminOnly: true,
  },
];

const MotionLink = motion.create(Link);

export type SettingsSectionLayoutProps = {
  children: ReactNode;
};

export function SettingsSectionLayout({ children }: SettingsSectionLayoutProps) {
  const pathname = usePathname();
  const t = useTranslations("settings");
  const isAdmin = useIsAdmin();
  const shouldReduceMotion = useReducedMotion();
  const visibleTabs = TABS.filter((tab) => !tab.adminOnly || isAdmin);
  const motionTransition = {
    duration: shouldReduceMotion ? 0 : 0.16,
    ease: [0.16, 1, 0.3, 1] as const,
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader title={t("title")} description={t("description")} />

      <nav
        aria-label={t("sectionsNav")}
        className="mb-6 grid grid-cols-2 gap-2 border-y border-warm-200 py-3 lg:hidden"
      >
        {visibleTabs.map(({ href, labelKey, icon: Icon }) => {
          const active = isActive(href);
          return (
            <MotionLink
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              initial={false}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
              transition={motionTransition}
              className={cn(
                "inline-flex min-h-12 w-full items-center gap-2 rounded-button px-2.5 py-2 text-left text-sm font-medium leading-5 outline-none transition-colors",
                "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                active
                  ? "bg-warm-100 font-semibold text-warm-900 ring-1 ring-inset ring-warm-200"
                  : "text-warm-600 hover:bg-warm-50 hover:text-warm-900",
              )}
            >
              <motion.span
                animate={{ scale: active ? 1 : 0.96 }}
                transition={motionTransition}
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-md",
                  active ? "bg-accent text-white" : "bg-warm-100 text-warm-600",
                )}
              >
                <Icon className="size-4" strokeWidth={1.8} aria-hidden />
              </motion.span>
              {t(labelKey)}
            </MotionLink>
          );
        })}
      </nav>

      <div className="flex items-start gap-8">
        <aside className="hidden w-72 shrink-0 lg:block">
          <nav
            aria-label={t("sectionsNav")}
            className="sticky top-24 rounded-card border border-warm-200 bg-surface p-2"
          >
            {(["personal", "workspace"] as const).map((group, groupIndex) => {
              const tabs = visibleTabs.filter((tab) => tab.group === group);
              if (tabs.length === 0) return null;

              return (
                <div
                  key={group}
                  className={cn(groupIndex > 0 && "mt-2 border-t border-warm-200 pt-2")}
                >
                  <p className="px-2 pb-1.5 pt-1 text-[11px] font-bold uppercase tracking-[0.1em] text-warm-500">
                    {t(group === "personal" ? "groupPersonal" : "groupWorkspace")}
                  </p>
                  <div className="space-y-1">
                    {tabs.map(({ href, labelKey, descriptionKey, icon: Icon }) => {
                      const active = isActive(href);
                      return (
                        <MotionLink
                          key={href}
                          href={href}
                          aria-current={active ? "page" : undefined}
                          initial={false}
                          whileHover={shouldReduceMotion ? undefined : { x: 2 }}
                          whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
                          transition={motionTransition}
                          className={cn(
                            "group flex min-h-16 items-center gap-3 rounded-button px-2.5 py-2 text-left outline-none transition-colors",
                            "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                            active
                              ? "bg-warm-100 text-warm-900"
                              : "text-warm-600 hover:bg-warm-50 hover:text-warm-900",
                          )}
                        >
                          <motion.span
                            animate={{ scale: active ? 1 : 0.96 }}
                            transition={motionTransition}
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-md transition-colors",
                              active
                                ? "bg-accent text-white"
                                : "bg-warm-100 text-warm-600 group-hover:bg-warm-200",
                            )}
                          >
                            <Icon className="size-[18px]" strokeWidth={1.8} aria-hidden />
                          </motion.span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">
                              {t(labelKey)}
                            </span>
                            <span className="mt-0.5 block text-xs leading-4 text-warm-500">
                              {t(descriptionKey)}
                            </span>
                          </span>
                          <ChevronRight
                            className={cn(
                              "size-4 shrink-0 transition-colors",
                              active ? "text-accent" : "text-warm-400",
                            )}
                            aria-hidden
                          />
                        </MotionLink>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
