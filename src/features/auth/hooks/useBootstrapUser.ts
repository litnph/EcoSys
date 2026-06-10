import { useEffect, useRef } from "react";

import { TOKEN_KEY } from "@/config/constants";
import { getMe, mapMeToUser } from "@/features/auth/api/userApi";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { useLocale, usePathname, useRouter } from "@/i18n/navigation";
import { getLocalStorageItem } from "@/shared/lib/auth-session";
import {
  applyAccountLocale,
  isAppLocale,
} from "@/shared/lib/localePreference";

/** Loads `/user/me` when tokens exist but `user` is null (page refresh). */
export function useBootstrapUser() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();
  const started = useRef(false);

  useEffect(() => {
    if (user || started.current) {
      return;
    }
    const access = getLocalStorageItem(TOKEN_KEY);
    if (!access) {
      return;
    }
    started.current = true;
    void getMe()
      .then((me) => {
        updateUser(mapMeToUser(me));
        const accountLocale = applyAccountLocale(me.languageCode);
        if (isAppLocale(currentLocale) && accountLocale !== currentLocale) {
          router.replace(pathname, {
            locale: accountLocale,
            preserveSearch: true,
          });
        }
      })
      .catch(() => {
        started.current = false;
        clearAuth();
      });
  }, [user, updateUser, clearAuth, router, pathname, currentLocale]);
}
