import type { ReactNode } from "react";

import { DashboardAuthGate } from "@/features/auth/components/DashboardAuthGate";
import { RequireWorkspace } from "@/features/spaces/components/RequireWorkspace";
import { DashboardLayout } from "@/shared/components/layouts/DashboardLayout";

type DashboardRouteLayoutProps = {
  children: ReactNode;
};

export default function DashboardRouteLayout({
  children,
}: DashboardRouteLayoutProps) {
  return (
    <DashboardAuthGate>
      <RequireWorkspace>
        <DashboardLayout>{children}</DashboardLayout>
      </RequireWorkspace>
    </DashboardAuthGate>
  );
}
