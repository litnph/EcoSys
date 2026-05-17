import type { ReactNode } from "react";

import { SettingsSectionLayout } from "@/features/settings/components/SettingsSectionLayout";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <SettingsSectionLayout>{children}</SettingsSectionLayout>;
}
