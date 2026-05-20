"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useToastStore } from "@/shared/stores/toastStore";

import { notificationKeys } from "../api/notificationKeys";
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notificationsApi";

export function useNotifications(
  page = 1,
  pageSize = 20,
  isRead?: boolean | null) {
  return useQuery({
    queryKey: notificationKeys.list(page, pageSize, isRead),
    queryFn: () => getNotifications({ page, pageSize, isRead }),
    staleTime: 15_000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const page = await getNotifications({ page: 1, pageSize: 1 });
      return page.unreadCount;
    },
    staleTime: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      addToast({ type: "success", title: "Đã đánh dấu tất cả đã đọc" });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      addToast({ type: "success", title: "Đã xóa thông báo" });
    },
    onError: () => {
      addToast({ type: "error", title: "Không xóa được thông báo" });
    },
  });
}
