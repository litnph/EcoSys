import type { ReactNode } from "react";

import { DashboardAuthGate } from "@/features/auth/components/DashboardAuthGate";

type OnboardingRouteLayoutProps = {
  children: ReactNode;
};

/**
 * Layout cho group `(onboarding)`:
 * - centered, không Sidebar / TopNav.
 * - vẫn yêu cầu user đã login (DashboardAuthGate).
 * - KHÔNG dùng `RequireWorkspace` — page bên trong (`/workspace-setup`) chính là
 *   nơi setup workspace.
 */
export default function OnboardingRouteLayout({
  children,
}: OnboardingRouteLayoutProps) {
  return (
    <DashboardAuthGate>
      <div className="flex min-h-screen items-center justify-center bg-warm-50 px-4 py-10">
        <div className="w-full max-w-3xl">{children}</div>
      </div>
    </DashboardAuthGate>
  );
}
