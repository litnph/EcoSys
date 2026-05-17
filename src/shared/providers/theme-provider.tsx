"use client";

import { useEffect, type ReactNode } from "react";

import { useThemeStore } from "@/shared/stores/themeStore";

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useThemeStore((s) => s.theme);
  const hydrateFromStorage = useThemeStore((s) => s.hydrateFromStorage);
  const syncResolvedFromSystem = useThemeStore((s) => s.syncResolvedFromSystem);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => syncResolvedFromSystem();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme, syncResolvedFromSystem]);

  return <>{children}</>;
}

export function useTheme() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  return { theme, setTheme, resolvedTheme };
}
