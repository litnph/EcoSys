import type { ReactNode } from "react";

import { DashboardAuthGate } from "@/features/auth/components/DashboardAuthGate";

type HubRouteLayoutProps = {
  children: ReactNode;
};

/**
 * Layout cho trung tâm quản lý tổ chức — yêu cầu đăng nhập, không bắt buộc workspace Finance.
 */
export default function HubRouteLayout({ children }: HubRouteLayoutProps) {
  return (
    <DashboardAuthGate>
      <div className="min-h-screen bg-warm-50">
        <div className="mx-auto max-w-5xl px-4 py-10">{children}</div>
      </div>
    </DashboardAuthGate>
  );
}
