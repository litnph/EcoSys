import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";
import en from "./en.json";
import vi from "./vi.json";

const messages = { en, vi } as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale =
    requested != null && requested in messages
      ? (requested as keyof typeof messages)
      : routing.defaultLocale;

  return {
    locale,
    messages: messages[locale],
  };
});
