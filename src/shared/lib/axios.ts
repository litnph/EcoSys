import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { NEXT_PUBLIC_API_URL } from "@/config/env";
import { resolveApiUserMessage } from "@/shared/lib/errorMessages";
import { REFRESH_TOKEN_KEY, TOKEN_KEY } from "@/config/constants";
import { useAuthStore } from "@/features/auth/stores/authStore";
import {
  getLocalStorageItem,
  getPreferredLocale,
  clearAuthTokens,
  redirectToLogin,
} from "@/shared/lib/auth-session";

declare module "axios" {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

const baseURL = `${NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1`;

export const apiClient = axios.create({
  baseURL,
  timeout: 30_000,
});

function attachUserFacingMessage(error: unknown): void {
  if (!axios.isAxiosError(error)) return;
  const data = error.response?.data;
  const msg = resolveApiUserMessage(data);
  if (msg) {
    (error as AxiosError).message = msg;
  }
}

function clearAuthAndRedirectToLogin(): void {
  clearAuthTokens();
  redirectToLogin();
}

type AuthTokenPayload = {
  accessToken: string;
  refreshToken: string;
};

function extractAuthPayload(data: unknown): AuthTokenPayload | null {
  if (data === null || typeof data !== "object") {
    return null;
  }
  const root = data as Record<string, unknown>;
  const inner =
    "data" in root && root.data !== null && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;
  const accessToken = inner.accessToken;
  const refreshToken = inner.refreshToken;
  if (typeof accessToken === "string" && typeof refreshToken === "string") {
    return { accessToken, refreshToken };
  }
  return null;
}

async function postRefresh(refreshToken: string): Promise<AuthTokenPayload> {
  const url = `${baseURL}/auth/refresh`;
  const { data } = await axios.post<unknown>(url, { refreshToken }, {
    timeout: 30_000,
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": getPreferredLocale(),
    },
  });

  if (
    data !== null &&
    typeof data === "object" &&
    "success" in data &&
    (data as { success?: boolean }).success === false
  ) {
    throw new Error("Refresh failed");
  }

  const payload = extractAuthPayload(data);
  if (!payload) {
    throw new Error("Invalid refresh response");
  }
  return payload;
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getLocalStorageItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const locale = getPreferredLocale();
  config.headers["Accept-Language"] = locale;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      return Promise.reject(
        new Error("Không thể kết nối đến server"),
      );
    }

    attachUserFacingMessage(error);

    const originalRequest = error.config as InternalAxiosRequestConfig &
      { _retry?: boolean };

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const storedRefresh = getLocalStorageItem(REFRESH_TOKEN_KEY);
      if (!storedRefresh) {
        clearAuthAndRedirectToLogin();
        return Promise.reject(error);
      }

      try {
        const tokens = await postRefresh(storedRefresh);
        useAuthStore.getState().setTokens(tokens.accessToken, tokens.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return apiClient(originalRequest);
      } catch {
        clearAuthAndRedirectToLogin();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);
