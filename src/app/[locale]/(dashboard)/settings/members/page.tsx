import { AdminOnly, MembersPage } from "@/features/members";

export default function SettingsMembersPage() {
  return (
    <AdminOnly>
      <MembersPage />
    </AdminOnly>
  );
}
