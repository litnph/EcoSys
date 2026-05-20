import axios from "axios";

import { NEXT_PUBLIC_API_URL } from "@/config/env";
import type { ApiResponse } from "@/shared/types/api";
import { apiClient } from "@/shared/lib/axios";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";
import { getPreferredLocale } from "@/shared/lib/auth-session";

import { useAuthStore } from "../stores/authStore";
import type { AuthResponse, LoginRequest, RegisterRequest } from "../types";
import { useWorkspaceStore } from "@/shared/stores/workspaceStore";

import { parseAuthPayload, parseTokenPair } from "./parseAuthPayload";

const apiRoot = `${NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1`;

/** Full-page redirect to backend Google OAuth (Google Console redirect URI: `{API}/signin-google`). */
export function getGoogleOAuthStartUrl(returnUrl?: string): string {
  const url = new URL(`${apiRoot}/auth/google`);
  if (returnUrl?.trim()) {
    url.searchParams.set("returnUrl", returnUrl.trim());
  }
  return url.toString();
}

function toSuccessResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

function assertEnvelopeSuccess<T>(res: ApiResponse<T>): asserts res is ApiResponse<T> & {
  success: true;
} {
  if (!res.success) {
    throw new Error(getFailureMessageFromApiBody(res));
  }
}

export async function login(
  data: LoginRequest,
): Promise<ApiResponse<AuthResponse>> {
  const { data: body } = await apiClient.post<unknown>("/auth/login", data);
  return toSuccessResponse(parseAuthPayload(body));
}

export async function register(
  data: RegisterRequest,
): Promise<ApiResponse<AuthResponse>> {
  const { data: body } = await apiClient.post<unknown>("/auth/register", data);
  return toSuccessResponse(parseAuthPayload(body));
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post("/auth/logout");
  } catch {
    /* still clear locally */
  } finally {
    useAuthStore.getState().clearAuth();
    try {
      useWorkspaceStore.getState().resetWorkspace();
    } catch {
      /* ignore */
    }
  }
}

export async function refreshToken(
  token: string,
): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
  const { data: body } = await axios.post<unknown>(
    `${apiRoot}/auth/refresh`,
    { refreshToken: token },
    {
      timeout: 30_000,
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": getPreferredLocale(),
      },
    },
  );
  return toSuccessResponse(parseTokenPair(body));
}

export async function forgotPassword(email: string): Promise<void> {
  const { data: body } = await apiClient.post<ApiResponse<unknown>>(
    "/auth/forgot-password",
    { email },
  );
  assertEnvelopeSuccess(body);
}

export async function resetPassword(
  token: string,
  password: string,
): Promise<void> {
  const { data: body } = await apiClient.post<ApiResponse<unknown>>(
    "/auth/reset-password",
    { token, newPassword: password },
  );
  assertEnvelopeSuccess(body);
}

export async function verifyEmail(token: string): Promise<void> {
  const { data: body } = await apiClient.post<ApiResponse<unknown>>(
    "/auth/verify-email",
    { token },
  );
  assertEnvelopeSuccess(body);
}

/** `POST /api/v1/auth/switch-organization` — JWT `org_id` + refresh rotation. */
export async function switchOrganization(
  organizationId: string,
): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
  const { data: body } = await apiClient.post<unknown>("/auth/switch-organization", {
    organizationId,
  });
  return toSuccessResponse(parseTokenPair(body));
}
