import type { ApiResponse } from "@/shared/types/api";
import { apiClient } from "@/shared/lib/axios";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";

import type {
  CreateMemberRequest,
  Member,
  UpdateMemberRequest,
} from "../types";

type ApiEnvelope<T> = ApiResponse<T>;

function assertData<T>(body: ApiEnvelope<T>): asserts body is ApiEnvelope<T> & {
  success: true;
  data: T;
} {
  if (!body.success) {
    throw new Error(getFailureMessageFromApiBody(body));
  }
  if (body.data === null || body.data === undefined) {
    throw new Error("Phản hồi API không hợp lệ");
  }
}

async function unwrap<T>(getter: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const { data: body } = await getter;
  assertData(body);
  return body.data;
}

interface RemoteMemberDto {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}

function mapMember(row: RemoteMemberDto): Member {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    role: row.role?.toLowerCase() === "admin" ? "admin" : "member",
    isActive: row.isActive,
    lastLoginAt: row.lastLoginAt ?? null,
    createdAt: row.createdAt,
  };
}

interface ListEnvelope {
  items: RemoteMemberDto[];
}

interface MemberEnvelope {
  member: RemoteMemberDto;
}

export async function getMembers(): Promise<Member[]> {
  const envelope = await unwrap<ListEnvelope>(apiClient.get("/members"));
  return envelope.items.map(mapMember);
}

export async function createMember(data: CreateMemberRequest): Promise<Member> {
  const envelope = await unwrap<MemberEnvelope>(
    apiClient.post("/members", {
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      role: data.role === "admin" ? "Admin" : "Member",
    }));
  return mapMember(envelope.member);
}

export async function updateMember(
  id: string,
  data: UpdateMemberRequest): Promise<Member> {
  const envelope = await unwrap<MemberEnvelope>(
    apiClient.put(`/members/${id}`, {
      fullName: data.fullName,
      role: data.role === "admin" ? "Admin" : "Member",
      isActive: data.isActive,
      newPassword: data.newPassword?.trim() || null,
    }));
  return mapMember(envelope.member);
}

export async function deleteMember(id: string): Promise<void> {
  await apiClient.delete(`/members/${id}`);
}
