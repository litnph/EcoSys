export const routing = {
  locales: ["en", "vi"] as const,
  defaultLocale: "en" as const,
};

export type AppLocale = (typeof routing.locales)[number];
