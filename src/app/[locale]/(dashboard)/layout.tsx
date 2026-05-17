import type { ReactNode } from "react";

import { DashboardAuthGate } from "@/features/auth/components/DashboardAuthGate";
import { DashboardLayout } from "@/shared/components/layouts/DashboardLayout";

type DashboardRouteLayoutProps = {
  children: ReactNode;
};

export default function DashboardRouteLayout({
  children,
}: DashboardRouteLayoutProps) {
  return (
    <DashboardAuthGate>
      <DashboardLayout>{children}</DashboardLayout>
    </DashboardAuthGate>
  );
}
