import type {
  FirstDayOfWeekPreference,
  TimeFormatPreference,
} from "../types";

const STORAGE_KEY = "ecosys.clientPreferences";

type StoredClientPrefs = {
  timeFormat?: TimeFormatPreference;
  firstDayOfWeek?: FirstDayOfWeekPreference;
};

export function readClientPreferences(): StoredClientPrefs {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredClientPrefs;
    return {
      timeFormat:
        parsed.timeFormat === "12h" || parsed.timeFormat === "24h"
          ? parsed.timeFormat
          : undefined,
      firstDayOfWeek:
        parsed.firstDayOfWeek === "sunday" || parsed.firstDayOfWeek === "monday"
          ? parsed.firstDayOfWeek
          : undefined,
    };
  } catch {
    return {};
  }
}

export function writeClientPreferences(partial: StoredClientPrefs): void {
  if (typeof window === "undefined") return;
  const merged = { ...readClientPreferences(), ...partial };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}
