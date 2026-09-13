import { ImageImportSettingsPanel } from "@/features/settings/components/ImageImportSettingsPanel";
import { AdminOnly } from "@/features/members";
import { useTranslations } from "@/i18n/hooks";

export function SettingsImageImportPage() {
  const t = useTranslations("settings");

  return (
    <AdminOnly
      title={t("imageImportAdminOnlyTitle")}
      description={t("imageImportAdminOnlyDescription")}
    >
      <ImageImportSettingsPanel />
    </AdminOnly>
  );
}
