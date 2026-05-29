import axios from "axios";

import { VITE_API_URL } from "@/config/env";
import type { ApiResponse } from "@/shared/types/api";
import { apiClient } from "@/shared/lib/axios";
import { getPreferredLocale } from "@/shared/lib/auth-session";

import { useAuthStore } from "../stores/authStore";
import type { AuthResponse, LoginRequest } from "../types";

import { parseAuthPayload, parseTokenPair } from "./parseAuthPayload";

const apiRoot = `${VITE_API_URL.replace(/\/$/, "")}/api/v1`;

function toSuccessResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export async function login(
  data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
  const { data: body } = await apiClient.post<unknown>("/auth/login", data);
  return toSuccessResponse(parseAuthPayload(body));
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post("/auth/logout");
  } catch {
    /* still clear locally */
  } finally {
    useAuthStore.getState().clearAuth();
  }
}

export async function refreshToken(
  token: string): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
  const { data: body } = await axios.post<unknown>(
    `${apiRoot}/auth/refresh`,
    { refreshToken: token },
    {
      timeout: 30_000,
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": getPreferredLocale(),
      },
    });
  return toSuccessResponse(parseTokenPair(body));
}
