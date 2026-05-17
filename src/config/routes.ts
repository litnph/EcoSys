export const ROUTES = {
  auth: {
    login: "/login",
    register: "/register",
    forgotPassword: "/forgot-password",
  },
  dashboard: {
    home: "/",
    profile: "/profile",
    transactions: "/transactions",
    sources: "/sources",
    billing: "/billing",
    installments: "/installments",
    debt: "/debt",
    reports: "/reports",
    settings: "/settings",
    settingsProfile: "/settings/profile",
    settingsSecurity: "/settings/security",
    settingsNotifications: "/settings/notifications",
    settingsPreferences: "/settings/preferences",
    settingsChangeEmail: "/settings/change-email",
  },
} as const;
