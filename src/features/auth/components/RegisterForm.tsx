"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ROUTES } from "@/config/routes";
import { Link } from "@/i18n/navigation";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { cn } from "@/shared/lib/utils";

import { useRegister } from "../hooks/useRegister";

function buildRegisterSchema(tVal: ReturnType<typeof useTranslations>) {
  return z
    .object({
      fullName: z.string().trim().min(1, tVal("nameRequired")),
      email: z
        .string()
        .trim()
        .min(1, tVal("emailRequired"))
        .pipe(z.email(tVal("emailInvalid"))),
      password: z
        .string()
        .min(1, tVal("passwordRequired"))
        .min(6, tVal("passwordMin")),
      confirmPassword: z.string().min(1, tVal("confirmRequired")),
    })
    .refine((values) => values.password === values.confirmPassword, {
      message: tVal("passwordMismatch"),
      path: ["confirmPassword"],
    });
}

type RegisterFormValues = z.infer<ReturnType<typeof buildRegisterSchema>>;

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { mutate, isPending } = useRegister();
  const tAuth = useTranslations("auth");
  const tVal = useTranslations("validation");
  const registerSchema = useMemo(() => buildRegisterSchema(tVal), [tVal]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  return (
    <form
      className="w-full space-y-4"
      noValidate
      onSubmit={handleSubmit(({ fullName, email, password }) => {
        mutate({ fullName, email, password });
      })}
    >
      <Input
        type="text"
        autoComplete="name"
        label={tAuth("fullName")}
        error={errors.fullName?.message}
        {...register("fullName")}
      />

      <Input
        type="email"
        autoComplete="email"
        label={tAuth("email")}
        error={errors.email?.message}
        {...register("email")}
      />

      <div className="w-full">
        <label
          htmlFor="register-password"
          className="mb-1 block text-sm font-medium text-warm-700"
        >
          {tAuth("password")}
        </label>
        <div className="relative">
          <input
            id="register-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            className={cn(
              "h-10 w-full rounded-button border bg-warm-50 px-3 pr-10 text-warm-900 transition-colors",
              "placeholder:text-warm-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30",
              errors.password
                ? "border-danger focus:border-danger focus:ring-danger/30"
                : "border-warm-200",
            )}
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={
              errors.password ? "register-password-error" : undefined
            }
            {...register("password")}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-warm-600 outline-none hover:bg-warm-100 hover:text-warm-900 focus-visible:ring-2 focus-visible:ring-accent/40"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? tAuth("hidePassword") : tAuth("showPassword")}
          >
            {showPassword ? (
              <EyeOff className="size-5" aria-hidden />
            ) : (
              <Eye className="size-5" aria-hidden />
            )}
          </button>
        </div>
        {errors.password ? (
          <p id="register-password-error" className="mt-1 text-sm text-danger" role="alert">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <div className="w-full">
        <label
          htmlFor="register-confirm"
          className="mb-1 block text-sm font-medium text-warm-700"
        >
          {tAuth("confirmPassword")}
        </label>
        <div className="relative">
          <input
            id="register-confirm"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            className={cn(
              "h-10 w-full rounded-button border bg-warm-50 px-3 pr-10 text-warm-900 transition-colors",
              "placeholder:text-warm-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30",
              errors.confirmPassword
                ? "border-danger focus:border-danger focus:ring-danger/30"
                : "border-warm-200",
            )}
            aria-invalid={errors.confirmPassword ? true : undefined}
            aria-describedby={
              errors.confirmPassword ? "register-confirm-error" : undefined
            }
            {...register("confirmPassword")}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-warm-600 outline-none hover:bg-warm-100 hover:text-warm-900 focus-visible:ring-2 focus-visible:ring-accent/40"
            onClick={() => setShowConfirm((v) => !v)}
            aria-label={
              showConfirm ? tAuth("hideConfirmPassword") : tAuth("showConfirmPassword")
            }
          >
            {showConfirm ? (
              <EyeOff className="size-5" aria-hidden />
            ) : (
              <Eye className="size-5" aria-hidden />
            )}
          </button>
        </div>
        {errors.confirmPassword ? (
          <p
            id="register-confirm-error"
            className="mt-1 text-sm text-danger"
            role="alert"
          >
            {errors.confirmPassword.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" size="lg" isLoading={isPending}>
        {tAuth("register")}
      </Button>

      <p className="text-center text-sm text-warm-600">
        {tAuth("hasAccount")}{" "}
        <Link
          href={ROUTES.auth.login}
          className="font-medium text-accent hover:text-accent-dark"
        >
          {tAuth("login")}
        </Link>
      </p>
    </form>
  );
}
