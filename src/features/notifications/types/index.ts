export type NotificationKind =
  | "budgetWarning"
  | "budgetReached"
  | "budgetExceeded"
  | "targetProgress"
  | "targetAchieved"
  | "targetExceeded";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  categoryId: string | null;
  categoryName: string | null;
  currency: string | null;
  spentAmount: number | null;
  budgetAmount: number | null;
  utilizationPercent: number | null;
  thresholdPercent: number | null;
  cycleStart: string | null;
  cycleEnd: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationList {
  items: AppNotification[];
  unreadCount: number;
}
