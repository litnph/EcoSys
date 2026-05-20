"use client";

import { create } from "zustand";

import type { FeatureFlag } from "../types";

interface FeatureFlagsState {
  flags: FeatureFlag[];
  isLoaded: boolean;
  setFlags: (flags: FeatureFlag[]) => void;
  isEnabled: (key: string) => boolean;
}

export const useFeatureFlagsStore = create<FeatureFlagsState>((set, get) => ({
  flags: [],
  isLoaded: false,
  setFlags: (flags) => set({ flags, isLoaded: true }),
  isEnabled: (key) => {
    const flag = get().flags.find((f) => f.key === key);
    return flag?.isEnabledForCurrentPrincipal ?? false;
  },
}));
