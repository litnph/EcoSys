"use client";

import { useEffect, useRef } from "react";

import { TOKEN_KEY } from "@/config/constants";
import { getMe, mapMeToUser } from "@/features/auth/api/userApi";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { getLocalStorageItem } from "@/shared/lib/auth-session";

/** Loads `/user/me` when tokens exist but `user` is null (page refresh). */
export function useBootstrapUser() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
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
      .then((me) => updateUser(mapMeToUser(me)))
      .catch(() => {
        started.current = false;
      });
  }, [user, updateUser]);
}
