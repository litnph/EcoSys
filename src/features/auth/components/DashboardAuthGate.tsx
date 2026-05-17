"use client";

import type { ReactNode } from "react";

import { useRequireAuth } from "@/shared/hooks/useRequireAuth";

type DashboardAuthGateProps = {
  children: ReactNode;
};

export function DashboardAuthGate({ children }: DashboardAuthGateProps) {
  const { isReady } = useRequireAuth();

  if (!isReady) {
    return (
      <div
        className="min-h-screen bg-warm-50"
        aria-busy="true"
        aria-label="Loading"
      />
    );
  }

  return <>{children}</>;
}
