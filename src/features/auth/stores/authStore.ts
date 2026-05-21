"use client";

import { create } from "zustand";

import { REFRESH_TOKEN_KEY, TOKEN_KEY } from "@/config/constants";
import { clearAuthCookies, setAuthCookies } from "@/shared/lib/auth-cookies";

import type { UserDto } from "../types";

export interface AuthStore {
  user: UserDto | null;
  /** Mirrored client-side after login for convenience; authoritative copy is always in localStorage. */
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserDto, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  hydrateFromStorage: () => void;
  updateUser: (user: UserDto) => void;
}

function readStoredAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function persistTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(TOKEN_KEY, accessToken);
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch {
    /* ignore */
  }
}

function clearStoredTokens(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

const storedAccess = readStoredAccessToken();

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  accessToken: storedAccess,
  isAuthenticated: Boolean(storedAccess),
  setAuth: (user, accessToken, refreshToken) => {
    persistTokens(accessToken, refreshToken);
    setAuthCookies(accessToken, refreshToken);
    set({
      user,
      accessToken,
      isAuthenticated: true,
    });
  },
  setTokens: (accessToken, refreshToken) => {
    persistTokens(accessToken, refreshToken);
    setAuthCookies(accessToken, refreshToken);
    set((s) => ({
      accessToken,
      isAuthenticated: true,
      user: s.user,
    }));
  },
  clearAuth: () => {
    clearStoredTokens();
    clearAuthCookies();
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
  hydrateFromStorage: () => {
    const access = readStoredAccessToken();
    if (access) {
      set({ accessToken: access, isAuthenticated: true });
      return;
    }
    set({ accessToken: null, isAuthenticated: false, user: null });
  },
  updateUser: (user) => set({ user }),
}));
