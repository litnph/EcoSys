"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";

import { useLogin } from "../hooks/useLogin";

function buildLoginSchema(tVal: ReturnType<typeof useTranslations>) {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, tVal("emailRequired"))
      .pipe(z.email(tVal("emailInvalid"))),
    password: z
      .string()
      .min(1, tVal("passwordRequired"))
      .min(6, tVal("passwordMin")),
    rememberMe: z.boolean().optional(),
  });
}

type LoginFormValues = z.infer<ReturnType<typeof buildLoginSchema>>;

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const { mutate, isPending } = useLogin();
  const tAuth = useTranslations("auth");
  const tVal = useTranslations("validation");
  const loginSchema = useMemo(() => buildLoginSchema(tVal), [tVal]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  return (
    <form
      className="w-full space-y-4"
      noValidate
      onSubmit={handleSubmit(({ email, password }) => {
        mutate({ email, password });
      })}
    >
      <Input
        type="email"
        autoComplete="email"
        label={tAuth("email")}
        error={errors.email?.message}
        {...register("email")}
      />

      <Input
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        label={tAuth("password")}
        error={errors.password?.message}
        rightIconInteractive
        rightIcon={
          <button
            type="button"
            className="rounded p-1 text-warm-600 outline-none hover:bg-warm-100 hover:text-warm-900 focus-visible:ring-2 focus-visible:ring-accent/40"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? tAuth("hidePassword") : tAuth("showPassword")}
          >
            {showPassword ? (
              <EyeOff className="size-5" aria-hidden />
            ) : (
              <Eye className="size-5" aria-hidden />
            )}
          </button>
        }
        {...register("password")}
      />

      <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-warm-700">
        <input
          type="checkbox"
          className="size-4 rounded border-warm-300 text-accent focus:ring-accent"
          {...register("rememberMe")}
        />
        {tAuth("rememberMe")}
      </label>

      <Button type="submit" className="w-full" size="lg" isLoading={isPending}>
        {tAuth("login")}
      </Button>
    </form>
  );
}
