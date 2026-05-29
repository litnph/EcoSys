import { AdminOnly, MembersPage } from "@/features/members";

export function SettingsMembersPage() {
  return (
    <AdminOnly>
      <MembersPage />
    </AdminOnly>
  );
}
