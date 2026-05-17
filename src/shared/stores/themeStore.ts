import { create } from "zustand";

export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "pf-ui-theme";

function readSystemDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveThemeMode(theme: ThemeMode): "light" | "dark" {
  if (theme === "system") {
    return readSystemDark() ? "dark" : "light";
  }
  return theme;
}

function applyThemeToDocument(theme: ThemeMode): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (theme === "dark") root.classList.add("dark");
  else if (theme === "light") root.classList.add("light");
}

function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {
    /* ignore */
  }
  return "system";
}

type ThemeState = {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeMode) => void;
  hydrateFromStorage: () => void;
  syncResolvedFromSystem: () => void;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "system",
  resolvedTheme: "light",

  hydrateFromStorage: () => {
    const theme = readStoredTheme();
    const resolved = resolveThemeMode(theme);
    applyThemeToDocument(theme);
    set({ theme, resolvedTheme: resolved });
  },

  setTheme: (theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
    const resolved = resolveThemeMode(theme);
    applyThemeToDocument(theme);
    set({ theme, resolvedTheme: resolved });
  },

  syncResolvedFromSystem: () => {
    if (get().theme !== "system") return;
    set({ resolvedTheme: resolveThemeMode("system") });
  },
}));
