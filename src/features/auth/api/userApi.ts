import type { UserDto, UserRole } from "@/features/auth/types";
import { apiClient } from "@/shared/lib/axios";
import type { ApiResponse } from "@/shared/types/api";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";

export type UserMeDto = {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  isEmailVerified: boolean;
  lastLoginAt?: string | null;
  languageCode: string;
  timezone: string;
  theme: string;
  avatarUrl?: string | null;
};

function assertSuccess<T>(res: ApiResponse<T>): asserts res is ApiResponse<T> & {
  success: true;
} {
  if (!res.success) {
    throw new Error(getFailureMessageFromApiBody(res));
  }
}

function parseRole(raw: unknown): UserRole {
  if (typeof raw === "string" && raw.toLowerCase() === "admin") {
    return "admin";
  }
  return "member";
}

export function mapMeToUser(me: UserMeDto): UserDto {
  return {
    id: me.userId,
    email: me.email,
    fullName: me.fullName,
    avatarUrl: me.avatarUrl ?? null,
    isVerified: me.isEmailVerified,
    role: parseRole(me.role),
  };
}

export async function getMe(): Promise<UserMeDto> {
  const { data: body } = await apiClient.get<ApiResponse<UserMeDto>>("/user/me");
  assertSuccess(body);
  return { ...body.data, role: parseRole(body.data.role) };
}
