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
