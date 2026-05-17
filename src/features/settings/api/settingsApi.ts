import type { UserDto } from "@/features/auth/types";
import { apiClient } from "@/shared/lib/axios";
import type { ApiResponse } from "@/shared/types/api";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";

import type {
  LoginHistoryRowDto,
  NotificationPreferencesDto,
  UserPreferencesDto,
  UserProfileBundleDto,
  UserSessionDto,
} from "../types";

function assertSuccess<T>(res: ApiResponse<T>): asserts res is ApiResponse<T> & {
  success: true;
} {
  if (!res.success) {
    throw new Error(getFailureMessageFromApiBody(res));
  }
}

function normalizePreferences(raw: Partial<UserPreferencesDto>): UserPreferencesDto {
  return {
    languageCode: raw.languageCode === "en" ? "en" : "vi",
    timezone: raw.timezone ?? "Asia/Ho_Chi_Minh",
    dateFormat: raw.dateFormat === "MM/dd/yyyy" ? "MM/dd/yyyy" : "dd/MM/yyyy",
    timeFormat: raw.timeFormat === "12h" ? "12h" : "24h",
    theme:
      raw.theme === "light" || raw.theme === "dark" || raw.theme === "system"
        ? raw.theme
        : "system",
    firstDayOfWeek: raw.firstDayOfWeek === "sunday" ? "sunday" : "monday",
  };
}

function normalizeSessionsPayload(body: unknown): UserSessionDto[] {
  if (!body || typeof body !== "object") {
    return [];
  }
  const root = body as Record<string, unknown>;
  if (Array.isArray(root)) {
    return root as UserSessionDto[];
  }
  const list = root.sessions ?? root.items;
  if (Array.isArray(list)) {
    return list as UserSessionDto[];
  }
  return [];
}

function normalizeHistoryPayload(body: unknown): LoginHistoryRowDto[] {
  if (!body || typeof body !== "object") {
    return [];
  }
  const root = body as Record<string, unknown>;
  const list = root.items ?? root.history ?? root;
  if (Array.isArray(list)) {
    return list as LoginHistoryRowDto[];
  }
  return [];
}

export async function getUserProfileBundle(): Promise<UserProfileBundleDto> {
  const { data: body } =
    await apiClient.get<ApiResponse<UserProfileBundleDto>>("/user/profile");
  assertSuccess(body);
  return body.data;
}

export async function updateProfileName(fullName: string): Promise<UserDto> {
  const { data: body } = await apiClient.patch<ApiResponse<{ user: UserDto }>>(
    "/user/profile",
    { fullName },
  );
  assertSuccess(body);
  return body.data.user;
}

export async function uploadProfileAvatar(file: File): Promise<{ avatarUrl: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const { data: body } = await apiClient.post<ApiResponse<{ avatarUrl: string }>>(
    "/user/profile/avatar",
    fd,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  assertSuccess(body);
  return body.data;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const { data: body } = await apiClient.post<ApiResponse<unknown>>(
    "/user/profile/change-password",
    { currentPassword, newPassword },
  );
  assertSuccess(body);
}

export async function getPreferences(): Promise<UserPreferencesDto> {
  const { data: body } =
    await apiClient.get<ApiResponse<UserPreferencesDto>>("/user/preferences");
  assertSuccess(body);
  return normalizePreferences(body.data);
}

export async function patchPreferences(
  patch: Partial<UserPreferencesDto>,
): Promise<UserPreferencesDto> {
  const { data: body } = await apiClient.patch<ApiResponse<UserPreferencesDto>>(
    "/user/preferences",
    patch,
  );
  assertSuccess(body);
  return normalizePreferences(body.data);
}

export async function listSessions(): Promise<UserSessionDto[]> {
  const { data: body } = await apiClient.get<ApiResponse<unknown>>("/user/sessions");
  assertSuccess(body);
  return normalizeSessionsPayload(body.data);
}

export async function revokeSession(sessionId: string): Promise<void> {
  const { data: body } = await apiClient.delete<ApiResponse<unknown>>(
    `/user/sessions/${sessionId}`,
  );
  assertSuccess(body);
}

export async function revokeAllOtherSessions(): Promise<void> {
  const { data: body } = await apiClient.post<ApiResponse<unknown>>(
    "/user/sessions/revoke-others",
    {},
  );
  assertSuccess(body);
}

export async function getLoginHistory(take = 30): Promise<LoginHistoryRowDto[]> {
  const { data: body } = await apiClient.get<ApiResponse<unknown>>(
    `/user/login-history`,
    { params: { take } },
  );
  assertSuccess(body);
  return normalizeHistoryPayload(body.data).slice(0, take);
}

export async function getNotificationPreferences(): Promise<NotificationPreferencesDto> {
  const { data: body } = await apiClient.get<ApiResponse<NotificationPreferencesDto>>(
    "/user/notification-preferences",
  );
  assertSuccess(body);
  return body.data;
}

export async function putNotificationPreferences(
  prefs: NotificationPreferencesDto,
): Promise<NotificationPreferencesDto> {
  const { data: body } = await apiClient.put<ApiResponse<NotificationPreferencesDto>>(
    "/user/notification-preferences",
    prefs,
  );
  assertSuccess(body);
  return body.data;
}
