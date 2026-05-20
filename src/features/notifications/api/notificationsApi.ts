import type { ApiResponse } from "@/shared/types/api";
import { apiClient } from "@/shared/lib/axios";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";

import type { Notification, NotificationsPage } from "../types";

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

interface RemoteNotificationDto {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

interface RemoteListEnvelope {
  items: RemoteNotificationDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  unreadCount: number;
}

function mapNotification(row: RemoteNotificationDto): Notification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    isRead: row.isRead,
    createdAt: row.createdAt,
  };
}

export async function getNotifications(params: {
  page?: number;
  pageSize?: number;
  isRead?: boolean | null;
}): Promise<NotificationsPage> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("page_size", String(params.pageSize));
  if (params.isRead !== undefined && params.isRead !== null) {
    qs.set("is_read", String(params.isRead));
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const envelope = await unwrap<RemoteListEnvelope>(
    apiClient.get(`/notifications${suffix}`),
  );
  return {
    items: envelope.items.map(mapNotification),
    page: envelope.page,
    pageSize: envelope.pageSize,
    totalCount: envelope.totalCount,
    totalPages: envelope.totalPages,
    unreadCount: envelope.unreadCount,
  };
}

export async function markNotificationRead(id: string): Promise<void> {
  await unwrap<{ id: string }>(apiClient.put(`/notifications/${id}/read`));
}

export async function markAllNotificationsRead(): Promise<number> {
  const envelope = await unwrap<{ updated: number }>(
    apiClient.put("/notifications/read-all"));
  return envelope.updated ?? 0;
}

export async function deleteNotification(id: string): Promise<void> {
  await unwrap<{ id: string }>(apiClient.delete(`/notifications/${id}`));
}
