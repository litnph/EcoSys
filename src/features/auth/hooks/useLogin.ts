import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import type { ApiResponse } from "@/shared/types/api";
import { useRouter } from "@/i18n/navigation";
import { useToastStore } from "@/shared/stores/toastStore";
import {
  resolvePostAuthPath,
  sanitizeReturnUrl,
} from "@/shared/lib/returnUrl";

import { getMe } from "../api/userApi";
import { login } from "../api/authApi";
import { useAuthStore } from "../stores/authStore";
import type { LoginRequest } from "../types";
import { applyAccountLocale } from "@/shared/lib/localePreference";

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
  const [searchParams] = useSearchParams();
  const addToast = useToastStore((s) => s.addToast);
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (data: LoginRequest) => login(data),
    onSuccess: async (response) => {
      const { accessToken, refreshToken, user } = response.data;
      setAuth(user, accessToken, refreshToken);
      const returnUrl = sanitizeReturnUrl(searchParams.get("returnUrl"));
      let accountLocale = applyAccountLocale("vi");
      try {
        const me = await getMe();
        accountLocale = applyAccountLocale(me.languageCode);
      } catch {
        /* keep default locale */
      }
      router.replace(resolvePostAuthPath(returnUrl), { locale: accountLocale });
      addToast({
        type: "success",
        title: "Đăng nhập thành công",
      });
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
