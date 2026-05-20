"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ROUTES } from "@/config/routes";
import { Link } from "@/i18n/navigation";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";

import { useResetPassword } from "../hooks/useResetPassword";

function buildSchema(tVal: ReturnType<typeof useTranslations>) {
  return z
    .object({
      password: z.string().min(8, tVal("passwordMin")),
      confirm: z.string().min(1, tVal("passwordRequired")),
    })
    .refine((d) => d.password === d.confirm, {
      message: tVal("passwordMismatch"),
      path: ["confirm"],
    });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export function ResetPasswordForm({ token }: { token: string }) {
  const { mutate, isPending, isSuccess } = useResetPassword();
  const tAuth = useTranslations("auth");
  const tVal = useTranslations("validation");
  const schema = useMemo(() => buildSchema(tVal), [tVal]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  if (isSuccess) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-warm-700">{tAuth("resetPasswordSuccess")}</p>
        <Link
          href={ROUTES.auth.login}
          className="font-medium text-accent hover:text-accent-dark"
        >
          {tAuth("backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form
      className="w-full space-y-4"
      noValidate
      onSubmit={handleSubmit(({ password }) => mutate({ token, password }))}
    >
      <Input
        type="password"
        autoComplete="new-password"
        label={tAuth("newPassword")}
        error={errors.password?.message}
        {...register("password")}
      />
      <Input
        type="password"
        autoComplete="new-password"
        label={tAuth("confirmPassword")}
        error={errors.confirm?.message}
        {...register("confirm")}
      />
      <Button type="submit" className="w-full" size="lg" isLoading={isPending}>
        {tAuth("resetPasswordSubmit")}
      </Button>
    </form>
  );
}
