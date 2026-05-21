import type { UserDto, UserRole } from "@/features/auth/types";
import { apiClient } from "@/shared/lib/axios";
import type { ApiResponse } from "@/shared/types/api";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";

import type { UserPreferencesDto, UserProfileBundleDto } from "../types";

function assertSuccess<T>(res: ApiResponse<T>): asserts res is ApiResponse<T> & {
  success: true;
} {
  if (!res.success) {
    throw new Error(getFailureMessageFromApiBody(res));
  }
}

type BeUserProfileDto = {
  userId: string;
  fullName: string;
  email: string;
  role?: string;
  languageCode: string;
  timezone: string;
  dateFormat: string;
  theme: string;
  displayName?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  avatarUrl?: string | null;
};

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

function mapProfileToUser(profile: BeUserProfileDto): UserDto {
  const role: UserRole =
    profile.role?.toLowerCase() === "admin" ? "admin" : "member";
  return {
    id: profile.userId,
    email: profile.email,
    fullName: profile.fullName,
    avatarUrl: profile.avatarUrl ?? null,
    isVerified: true,
    role,
  };
}

function mapProfileToPreferences(profile: BeUserProfileDto): UserPreferencesDto {
  return normalizePreferences({
    languageCode: profile.languageCode === "en" ? "en" : "vi",
    timezone: profile.timezone,
    dateFormat: profile.dateFormat === "MM/dd/yyyy" ? "MM/dd/yyyy" : "dd/MM/yyyy",
    theme:
      profile.theme === "light" || profile.theme === "dark" || profile.theme === "system"
        ? profile.theme
        : "system",
  });
}

async function fetchProfileDto(): Promise<BeUserProfileDto> {
  const { data: body } =
    await apiClient.get<ApiResponse<{ profile: BeUserProfileDto }>>("/user/profile");
  assertSuccess(body);
  return body.data.profile;
}

async function putProfileDto(payload: {
  fullName: string;
  displayName?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  languageCode: string;
  timezone: string;
  dateFormat: string;
  theme: string;
}): Promise<BeUserProfileDto> {
  const { data: body } = await apiClient.put<ApiResponse<{ profile: BeUserProfileDto }>>(
    "/user/profile",
    payload);
  assertSuccess(body);
  return body.data.profile;
}

function profilePayloadFromDto(
  profile: BeUserProfileDto,
  overrides: Partial<{
    fullName: string;
    languageCode: string;
    timezone: string;
    dateFormat: string;
    theme: string;
  }> = {}) {
  return {
    fullName: overrides.fullName ?? profile.fullName,
    displayName: profile.displayName ?? null,
    phoneNumber: profile.phoneNumber ?? null,
    dateOfBirth: profile.dateOfBirth ?? null,
    languageCode: overrides.languageCode ?? profile.languageCode,
    timezone: overrides.timezone ?? profile.timezone,
    dateFormat: overrides.dateFormat ?? profile.dateFormat,
    theme: overrides.theme ?? profile.theme,
  };
}

export async function getUserProfileBundle(): Promise<UserProfileBundleDto> {
  const profile = await fetchProfileDto();
  return {
    user: mapProfileToUser(profile),
    preferences: mapProfileToPreferences(profile),
  };
}

export async function updateProfileName(fullName: string): Promise<UserDto> {
  const current = await fetchProfileDto();
  const updated = await putProfileDto({
    ...profilePayloadFromDto(current, { fullName }),
  });
  return mapProfileToUser(updated);
}

export async function uploadProfileAvatar(file: File): Promise<{ avatarUrl: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const { data: body } = await apiClient.post<
    ApiResponse<{ avatarUrl: string }>
  >("/user/avatar", fd, { headers: { "Content-Type": "multipart/form-data" } });
  assertSuccess(body);
  return { avatarUrl: body.data.avatarUrl };
}

export async function changePassword(
  currentPassword: string,
  newPassword: string): Promise<void> {
  const { data: body } = await apiClient.put<ApiResponse<unknown>>("/user/password", {
    currentPassword,
    newPassword,
  });
  assertSuccess(body);
}

export async function getPreferences(): Promise<UserPreferencesDto> {
  const profile = await fetchProfileDto();
  return mapProfileToPreferences(profile);
}

export async function patchPreferences(
  patch: Partial<UserPreferencesDto>): Promise<UserPreferencesDto> {
  const current = await fetchProfileDto();
  const merged = normalizePreferences({
    ...mapProfileToPreferences(current),
    ...patch,
  });
  const updated = await putProfileDto({
    ...profilePayloadFromDto(current, {
      languageCode: merged.languageCode,
      timezone: merged.timezone,
      dateFormat: merged.dateFormat,
      theme: merged.theme,
    }),
  });
  return mapProfileToPreferences(updated);
}
