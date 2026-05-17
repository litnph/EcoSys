"use client";

import { create } from "zustand";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastRecord {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
}

const DEFAULT_DURATION = 4000;
export const MAX_TOASTS = 5;

function createId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `toast_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export interface ToastStore {
  toasts: ToastRecord[];
  addToast: (
    toast: Omit<ToastRecord, "id" | "duration"> &
      Partial<Pick<ToastRecord, "id" | "duration">>,
  ) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = toast.id ?? createId();
    const duration =
      toast.duration !== undefined ? toast.duration : DEFAULT_DURATION;

    const nextRecord: ToastRecord = {
      id,
      type: toast.type,
      title: toast.title,
      message: toast.message,
      duration,
    };

    set((s) => ({
      toasts: [...s.toasts.filter((t) => t.id !== id), nextRecord].slice(
        -MAX_TOASTS,
      ),
    }));
    return id;
  },
  removeToast: (id) =>
    set((s) => ({ ...s, toasts: s.toasts.filter((t) => t.id !== id) })),
  clearAll: () => set({ toasts: [] }),
}));
