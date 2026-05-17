"use client";

import { useMutation } from "@tanstack/react-query";
import axios from "axios";

import type { ApiResponse } from "@/shared/types/api";
import { useToastStore } from "@/shared/stores/toastStore";

import { forgotPassword } from "../api/authApi";

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

export function useForgotPassword() {
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (email: string) => forgotPassword(email),
    onSuccess: () => {
      addToast({
        type: "success",
        title: "Kiểm tra email của bạn",
      });
    },
    onError: (error) => {
      addToast({
        type: "error",
        title: "Không thể gửi yêu cầu",
        message: getApiErrorMessage(error),
      });
    },
  });
}
