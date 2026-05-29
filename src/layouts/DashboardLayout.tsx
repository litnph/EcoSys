import { Outlet } from "react-router-dom";

import { DashboardAuthGate } from "@/features/auth/components/DashboardAuthGate";
import { DashboardLayout as DashboardShell } from "@/shared/components/layouts/DashboardLayout";

export function DashboardRouteLayout() {
  return (
    <DashboardAuthGate>
      <DashboardShell>
        <Outlet />
      </DashboardShell>
    </DashboardAuthGate>
  );
}
