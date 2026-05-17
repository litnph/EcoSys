"use client";

import { useMutation } from "@tanstack/react-query";
import axios from "axios";

import { ROUTES } from "@/config/routes";
import type { ApiResponse } from "@/shared/types/api";
import { useRouter } from "@/i18n/navigation";
import { useToastStore } from "@/shared/stores/toastStore";

import { login } from "../api/authApi";
import { useAuthStore } from "../stores/authStore";
import type { LoginRequest } from "../types";

function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as ApiResponse<unknown> | undefined;
    if (payload?.error?.message) {
      return payload.error.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Đã có lỗi xảy ra";
}

export function useLogin() {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (data: LoginRequest) => login(data),
    onSuccess: (response) => {
      const { accessToken, refreshToken, user } = response.data;
      setAuth(user, accessToken, refreshToken);
      addToast({
        type: "success",
        title: "Đăng nhập thành công",
      });
      router.replace(ROUTES.dashboard.home);
    },
    onError: (error) => {
      addToast({
        type: "error",
        title: "Đăng nhập thất bại",
        message: getApiErrorMessage(error),
      });
    },
  });
}
