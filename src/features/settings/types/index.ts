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
  monthlyReportDay: number;
};

export type UserProfileBundleDto = {
  user: UserDto;
  preferences: UserPreferencesDto;
};

export type ClassificationRule = {
  id: string;
  keyword: string;
  categoryId: string;
  categoryName: string;
  tagId: string | null;
  tagName: string | null;
  tagColor: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ClassificationRuleInput = {
  keyword: string;
  categoryId: string;
  tagId: string | null;
  isActive: boolean;
};

export type ClassificationMatch = {
  key: string;
  ruleId: string | null;
  categoryId: string | null;
  tagId: string | null;
};
