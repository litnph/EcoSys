const FALLBACK_ZONES = [
  "UTC",
  "Asia/Ho_Chi_Minh",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
] as const;

export function getAllTimeZoneIds(): string[] {
  try {
    const list = Intl.supportedValuesOf("timeZone");
    return [...list];
  } catch {
    return [...FALLBACK_ZONES];
  }
}
