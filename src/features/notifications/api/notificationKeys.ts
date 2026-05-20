export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (page: number, pageSize: number, isRead?: boolean | null) =>
    [...notificationKeys.lists(), page, pageSize, isRead ?? "__all__"] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};
