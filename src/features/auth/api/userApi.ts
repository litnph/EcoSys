import type { UserDto } from "@/features/auth/types";
import { apiClient } from "@/shared/lib/axios";
import type { ApiResponse } from "@/shared/types/api";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";

export type UserMeDto = {
  userId: string;
  email: string;
  fullName: string;
  isEmailVerified: boolean;
  lastLoginAt?: string | null;
  languageCode: string;
  timezone: string;
  theme: string;
  avatarUrl?: string | null;
  personalOrgId: string;
};

function assertSuccess<T>(res: ApiResponse<T>): asserts res is ApiResponse<T> & {
  success: true;
} {
  if (!res.success) {
    throw new Error(getFailureMessageFromApiBody(res));
  }
}

export function mapMeToUser(me: UserMeDto): UserDto {
  return {
    id: me.userId,
    email: me.email,
    fullName: me.fullName,
    avatarUrl: me.avatarUrl ?? null,
    isVerified: me.isEmailVerified,
  };
}

export async function getMe(): Promise<UserMeDto> {
  const { data: body } = await apiClient.get<ApiResponse<UserMeDto>>("/user/me");
  assertSuccess(body);
  return body.data;
}
