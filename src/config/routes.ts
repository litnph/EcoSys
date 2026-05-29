export const ROUTES = {
  auth: {
    login: "/login",
  },
  dashboard: {
    home: "/",
    profile: "/profile",
    transactions: "/transactions",
    sources: "/sources",
    sourceLedger: (id: string) => `/sources/${id}/ledger` as const,
    billing: "/billing",
    installments: "/installments",
    debt: "/debt",
    reports: "/reports",
    categories: "/categories",
    savings: "/savings",
    investments: "/investments",
    tags: "/tags",
    settings: "/settings",
    settingsProfile: "/settings/profile",
    settingsPreferences: "/settings/preferences",
    settingsMembers: "/settings/members",
  },
} as const;
