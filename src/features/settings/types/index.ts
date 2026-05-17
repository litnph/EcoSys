import type { UserDto } from "@/features/auth/types";

export type ThemePreference = "light" | "dark" | "system";

export type TimeFormatPreference = "24h" | "12h";

export type FirstDayOfWeekPreference = "monday" | "sunday";

export type DateFormatPreference = "dd/MM/yyyy" | "MM/dd/yyyy";

export type UserPreferencesDto = {
  languageCode: "vi" | "en";
  timezone: string;
  dateFormat: DateFormatPreference;
  timeFormat: TimeFormatPreference;
  theme: ThemePreference;
  firstDayOfWeek: FirstDayOfWeekPreference;
};

export type UserProfileBundleDto = {
  user: UserDto;
  preferences: UserPreferencesDto;
};

export type UserSessionDto = {
  id: string;
  deviceType: "web" | "mobile" | "tablet" | "desktop" | string | null;
  deviceName: string | null;
  browser: string | null;
  userAgent?: string | null;
  location: { city?: string | null; country?: string | null } | null;
  lastActiveAt: string;
  isCurrent?: boolean;
};

export type LoginHistoryRowDto = {
  id: string;
  occurredAt: string;
  ipAddress: string | null;
  device: string | null;
  success: boolean;
};

export type NotificationChannelKey = "inApp" | "email";

export type NotificationPrefMatrixCell = {
  /** Matches backend `ModuleCode.Finance` (1) when JSON is numeric. */
  moduleCode: number;
  eventType: string;
  channel: NotificationChannelKey;
  enabled: boolean;
};

export type NotificationPreferencesDto = {
  cells: NotificationPrefMatrixCell[];
};
