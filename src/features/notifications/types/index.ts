export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsPage {
  items: Notification[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  unreadCount: number;
}
