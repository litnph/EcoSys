import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";

import type { AuthResponse, UserDto } from "../types";

type LooseRecord = Record<string, unknown>;

function readString(obj: LooseRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return undefined;
}

function parseUser(source: LooseRecord): UserDto {
  const id = readString(source, "id", "userId", "UserId") ?? "";
  const email = readString(source, "email", "Email") ?? "";
  const fullName = readString(source, "fullName", "FullName") ?? "";
  const avatarRaw = readString(source, "avatarUrl", "AvatarUrl");
  const isVerified = Boolean(
    source.isVerified ?? source.isEmailVerified ?? source.IsEmailVerified,
  );

  return {
    id,
    email,
    fullName,
    avatarUrl: avatarRaw ?? null,
    isVerified,
  };
}

function unwrapApiPayload(body: unknown): LooseRecord {
  if (body === null || typeof body !== "object") {
    throw new Error("Phản hồi không hợp lệ");
  }

  const root = body as LooseRecord;

  if (root.success === false) {
    throw new Error(getFailureMessageFromApiBody(root));
  }

  return root.data !== null && typeof root.data === "object"
    ? (root.data as LooseRecord)
    : root;
}

function parseTokenPairFromPayload(payload: LooseRecord): {
  accessToken: string;
  refreshToken: string;
} {
  const accessToken = readString(payload, "accessToken", "AccessToken");
  const refreshToken = readString(payload, "refreshToken", "RefreshToken");
  if (!accessToken || !refreshToken) {
    throw new Error("Phản hồi thiếu token đăng nhập");
  }
  return { accessToken, refreshToken };
}

/** Login/register — requires user profile in the payload. */
export function parseAuthPayload(body: unknown): AuthResponse {
  const payload = unwrapApiPayload(body);
  const { accessToken, refreshToken } = parseTokenPairFromPayload(payload);

  const userSource =
    payload.user !== null && typeof payload.user === "object"
      ? (payload.user as LooseRecord)
      : payload;

  const user = parseUser(userSource);
  if (!user.id || !user.email) {
    throw new Error("Phản hồi thiếu thông tin người dùng");
  }

  return { accessToken, refreshToken, user };
}

/** Refresh / switch-organization — tokens only (no email on the wire). */
export function parseTokenPair(
  body: unknown,
): { accessToken: string; refreshToken: string } {
  return parseTokenPairFromPayload(unwrapApiPayload(body));
}
