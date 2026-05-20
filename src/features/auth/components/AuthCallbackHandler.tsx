"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { ROUTES } from "@/config/routes";
import { getMe, mapMeToUser } from "@/features/auth/api/userApi";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { useRouter } from "@/i18n/navigation";
import { resolvePostAuthPath, sanitizeReturnUrl } from "@/shared/lib/returnUrl";

export function AuthCallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const access = searchParams.get("access_token");
    const refresh = searchParams.get("refresh_token");
    const returnUrl = sanitizeReturnUrl(searchParams.get("returnUrl"));

    if (!access || !refresh) {
      setError("Thiếu token đăng nhập từ Google.");
      return;
    }

    const run = async () => {
      try {
        useAuthStore.getState().setTokens(access, refresh);
        const me = await getMe();
        setAuth(mapMeToUser(me), access, refresh);
        router.replace(resolvePostAuthPath(returnUrl));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Đăng nhập Google thất bại");
      }
    };

    void run();
  }, [searchParams, router, setAuth]);

  if (error) {
    return (
      <p className="text-center text-sm text-danger">
        {error}{" "}
        <button
          type="button"
          className="font-medium text-accent underline"
          onClick={() => router.replace(ROUTES.auth.login)}
        >
          Quay lại đăng nhập
        </button>
      </p>
    );
  }

  return (
    <p className="text-center text-sm text-warm-600" aria-busy="true">
      Đang hoàn tất đăng nhập…
    </p>
  );
}
