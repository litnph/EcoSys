"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "@/i18n/navigation";

import { useAuthStore } from "@/features/auth/stores/authStore";
import { useToastStore } from "@/shared/stores/toastStore";

import {
  changePassword,
  getPreferences,
  getUserProfileBundle,
  patchPreferences,
  updateProfileName,
  uploadProfileAvatar,
} from "../api/settingsApi";
import { settingsKeys } from "../api/settingsKeys";
import type { UserPreferencesDto } from "../types";

export function useUserProfileBundle() {
  return useQuery({
    queryKey: settingsKeys.profile(),
    queryFn: getUserProfileBundle,
    staleTime: 30_000,
    retry: false,
  });
}

export function usePreferencesQuery(enabled = true) {
  return useQuery({
    queryKey: [...settingsKeys.root, "preferences"] as const,
    queryFn: getPreferences,
    staleTime: 30_000,
    retry: false,
    enabled,
  });
}

export function usePatchPreferences() {
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (patch: Partial<UserPreferencesDto>) => patchPreferences(patch),
    onSuccess: async (_next, vars) => {
      await qc.invalidateQueries({ queryKey: [...settingsKeys.root, "preferences"] });
      await qc.invalidateQueries({ queryKey: settingsKeys.profile() });
      const lang = vars.languageCode;
      if (lang !== "vi" && lang !== "en") {
        return;
      }
      const seg = typeof window !== "undefined"
        ? window.location.pathname.split("/").filter(Boolean)[0]
        : "";
      if (seg !== lang) {
        router.replace(pathname, { locale: lang });
      }
    },
    onError: (e: Error) => {
      addToast({
        type: "error",
        title: "Không lưu được tùy chọn",
        message: e.message,
      });
    },
  });
}

export function useUpdateProfileSection() {
  const qc = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const updateUser = useAuthStore((s) => s.updateUser);

  return useMutation({
    mutationFn: async (args: { fullName: string; avatarFile?: File | null }) => {
      if (args.avatarFile) {
        const { avatarUrl } = await uploadProfileAvatar(args.avatarFile);
        const current = useAuthStore.getState().user;
        if (current) {
          useAuthStore.getState().updateUser({ ...current, avatarUrl });
        }
      }
      return updateProfileName(args.fullName);
    },
    onSuccess: (user) => {
      updateUser(user);
      void qc.invalidateQueries({ queryKey: settingsKeys.profile() });
      addToast({
        type: "success",
        title: "Đã cập nhật hồ sơ",
      });
    },
    onError: (e: Error) => {
      addToast({
        type: "error",
        title: "Cập nhật hồ sơ thất bại",
        message: e.message,
      });
    },
  });
}

export function useChangePasswordMutation() {
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (args: { currentPassword: string; newPassword: string }) =>
      changePassword(args.currentPassword, args.newPassword),
    onSuccess: () => {
      addToast({
        type: "success",
        title: "Đã đổi mật khẩu",
      });
    },
    onError: (e: Error) => {
      addToast({
        type: "error",
        title: "Đổi mật khẩu thất bại",
        message: e.message,
      });
    },
  });
}
