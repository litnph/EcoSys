import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { notificationKeys } from "../api/notificationKeys";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notificationsApi";

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: getUnreadNotificationCount,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useNotifications(enabled: boolean) {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: getNotifications,
    enabled,
    staleTime: 10_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
