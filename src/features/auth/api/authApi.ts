import axios from "axios";

import { NEXT_PUBLIC_API_URL } from "@/config/env";
import type { ApiResponse } from "@/shared/types/api";
import { apiClient } from "@/shared/lib/axios";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";
import { getPreferredLocale } from "@/shared/lib/auth-session";

import { useAuthStore } from "../stores/authStore";
import type { AuthResponse, LoginRequest, RegisterRequest } from "../types";

const apiRoot = `${NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1`;

function assertSuccess<T>(res: ApiResponse<T>): asserts res is ApiResponse<T> & {
  success: true;
} {
  if (!res.success) {
    throw new Error(getFailureMessageFromApiBody(res));
  }
}

export async function login(
  data: LoginRequest,
): Promise<ApiResponse<AuthResponse>> {
  const { data: body } = await apiClient.post<ApiResponse<AuthResponse>>(
    "/auth/login",
    data,
  );
  assertSuccess(body);
  return body;
}

export async function register(
  data: RegisterRequest,
): Promise<ApiResponse<AuthResponse>> {
  const { data: body } = await apiClient.post<ApiResponse<AuthResponse>>(
    "/auth/register",
    data,
  );
  assertSuccess(body);
  return body;
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
  token: string,
): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
  const { data: body } = await axios.post<
    ApiResponse<{ accessToken: string; refreshToken: string }>
  >(`${apiRoot}/auth/refresh`, { refreshToken: token }, {
    timeout: 30_000,
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": getPreferredLocale(),
    },
  });
  assertSuccess(body);
  return body;
}

export async function forgotPassword(email: string): Promise<void> {
  const { data: body } = await apiClient.post<ApiResponse<unknown>>(
    "/auth/forgot-password",
    { email },
  );
  assertSuccess(body);
}

export async function resetPassword(
  token: string,
  password: string,
): Promise<void> {
  const { data: body } = await apiClient.post<ApiResponse<unknown>>(
    "/auth/reset-password",
    { token, password },
  );
  assertSuccess(body);
}

export async function verifyEmail(token: string): Promise<void> {
  const { data: body } = await apiClient.post<ApiResponse<unknown>>(
    "/auth/verify-email",
    { token },
  );
  assertSuccess(body);
}
