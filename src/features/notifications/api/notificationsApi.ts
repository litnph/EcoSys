import { apiClient } from "@/shared/lib/axios";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";
import type { ApiResponse } from "@/shared/types/api";

import type { AppNotification, NotificationKind, NotificationList } from "../types";

function unwrap<T>(body: ApiResponse<T>): T {
  if (!body.success || body.data === null || body.data === undefined) {
    throw new Error(getFailureMessageFromApiBody(body));
  }
  return body.data;
}

function kind(value: string): NotificationKind {
  if (
    value === "budgetReached"
    || value === "budgetExceeded"
    || value === "targetProgress"
    || value === "targetAchieved"
    || value === "targetExceeded"
  ) return value;
  return "budgetWarning";
}

export async function getNotifications(): Promise<NotificationList> {
  const { data: body } = await apiClient.get<ApiResponse<{
    items: Array<Omit<AppNotification, "kind"> & { kind: string }>;
    unreadCount: number;
  }>>("/notifications");
  const data = unwrap(body);
  return {
    unreadCount: Number(data.unreadCount),
    items: data.items.map((item) => ({
      ...item,
      kind: kind(item.kind),
      spentAmount: item.spentAmount === null ? null : Number(item.spentAmount),
      budgetAmount: item.budgetAmount === null ? null : Number(item.budgetAmount),
      utilizationPercent:
        item.utilizationPercent === null ? null : Number(item.utilizationPercent),
      thresholdPercent:
        item.thresholdPercent === null ? null : Number(item.thresholdPercent),
    })),
  };
}

export async function getUnreadNotificationCount(): Promise<number> {
  const { data: body } = await apiClient.get<ApiResponse<{ unreadCount: number }>>(
    "/notifications/unread-count",
  );
  return Number(unwrap(body).unreadCount);
}

export async function markNotificationRead(id: string): Promise<void> {
  const { data: body } = await apiClient.put<ApiResponse<unknown>>(`/notifications/${id}/read`);
  unwrap(body);
}

export async function markAllNotificationsRead(): Promise<void> {
  const { data: body } = await apiClient.put<ApiResponse<unknown>>("/notifications/read-all");
  unwrap(body);
}
