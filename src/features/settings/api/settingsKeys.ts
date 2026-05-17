export const settingsKeys = {
  root: ["settings"] as const,
  profile: () => [...settingsKeys.root, "profile"] as const,
  sessions: () => [...settingsKeys.root, "sessions"] as const,
  loginHistory: () => [...settingsKeys.root, "login-history"] as const,
  notificationPrefs: () => [...settingsKeys.root, "notification-prefs"] as const,
};
