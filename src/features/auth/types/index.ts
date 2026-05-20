export type UserRole = "admin" | "member";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  isVerified: boolean;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}
