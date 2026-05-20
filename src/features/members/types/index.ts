import type { UserRole } from "@/features/auth/types";

export type Member = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export type CreateMemberRequest = {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
};

export type UpdateMemberRequest = {
  fullName: string;
  role: UserRole;
  isActive: boolean;
  newPassword?: string;
};
