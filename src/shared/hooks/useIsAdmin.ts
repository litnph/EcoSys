"use client";

import { useAuthStore } from "@/features/auth/stores/authStore";

export function useIsAdmin(): boolean {
  return useAuthStore((s) => s.user?.role === "admin");
}
