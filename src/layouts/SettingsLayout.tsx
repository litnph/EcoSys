import { Outlet } from "react-router-dom";

import { SettingsSectionLayout } from "@/features/settings/components/SettingsSectionLayout";

export function SettingsRouteLayout() {
  return (
    <SettingsSectionLayout>
      <Outlet />
    </SettingsSectionLayout>
  );
}
