import { redirect } from "@/i18n/navigation";

import { ROUTES } from "@/config/routes";

type SettingsIndexPageProps = {
  params: { locale: string };
};

export default function SettingsIndexPage({ params }: SettingsIndexPageProps) {
  redirect({ href: ROUTES.dashboard.settingsProfile, locale: params.locale });
}
