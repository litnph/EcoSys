"use client";

import { useEffect, useState } from "react";

import { ROUTES } from "@/config/routes";
import { Link } from "@/i18n/navigation";

import { useVerifyEmail } from "../hooks/useVerifyEmail";

export function VerifyEmailHandler({ token }: { token: string }) {
  const verify = useVerifyEmail();
  const [ran, setRan] = useState(false);

  useEffect(() => {
    if (!token || ran) {
      return;
    }
    setRan(true);
    verify.mutate(token);
  }, [token, ran, verify]);

  if (verify.isPending) {
    return (
      <p className="text-center text-sm text-warm-600" aria-busy="true">
        Đang xác minh email…
      </p>
    );
  }

  if (verify.isError) {
    return (
      <div className="space-y-3 text-center text-sm">
        <p className="text-danger">
          {verify.error instanceof Error
            ? verify.error.message
            : "Xác minh thất bại"}
        </p>
        <Link href={ROUTES.auth.login} className="font-medium text-accent hover:underline">
          Đăng nhập
        </Link>
      </div>
    );
  }

  if (verify.isSuccess) {
    return (
      <div className="space-y-3 text-center text-sm">
        <p className="text-warm-800">Email đã được xác minh.</p>
        <Link href={ROUTES.auth.login} className="font-medium text-accent hover:underline">
          Đăng nhập
        </Link>
      </div>
    );
  }

  return null;
}
