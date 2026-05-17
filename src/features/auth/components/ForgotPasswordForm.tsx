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

import { useForgotPassword } from "../hooks/useForgotPassword";

function buildForgotSchema(tVal: ReturnType<typeof useTranslations>) {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, tVal("emailRequired"))
      .pipe(z.email(tVal("emailInvalid"))),
  });
}

type ForgotFormValues = z.infer<ReturnType<typeof buildForgotSchema>>;

export function ForgotPasswordForm() {
  const { mutate, isPending } = useForgotPassword();
  const tAuth = useTranslations("auth");
  const tVal = useTranslations("validation");
  const forgotSchema = useMemo(() => buildForgotSchema(tVal), [tVal]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  return (
    <form
      className="w-full space-y-4"
      noValidate
      onSubmit={handleSubmit(({ email }) => {
        mutate(email);
      })}
    >
      <Input
        type="email"
        autoComplete="email"
        label={tAuth("email")}
        error={errors.email?.message}
        {...register("email")}
      />

      <Button type="submit" className="w-full" size="lg" isLoading={isPending}>
        {tAuth("sendResetLink")}
      </Button>

      <p className="text-center text-sm text-warm-600">
        <Link
          href={ROUTES.auth.login}
          className="font-medium text-accent hover:text-accent-dark"
        >
          {tAuth("backToLogin")}
        </Link>
      </p>
    </form>
  );
}
