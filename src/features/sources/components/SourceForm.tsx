"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/shared/components/ui/Button";
import { CurrencyInput } from "@/shared/components/ui/CurrencyInput";
import { Input } from "@/shared/components/ui/Input";
import { cn } from "@/shared/lib/utils";
import { scrollFirstHookFormErrorIntoView } from "@/shared/lib/scrollFirstFormError";

import { useCreateSource } from "../hooks/useCreateSource";
import { useUpdateSource } from "../hooks/useUpdateSource";
import type { FinSource, FinSourceType } from "../types";

const finSourceTypeZ = z.enum([
  "cash",
  "bankAccount",
  "creditCard",
  "eWallet",
  "investment",
]);

const sourceFormSchema = z
  .object({
    name: z.string().trim().min(1, "Vui lòng nhập tên"),
    type: finSourceTypeZ,
    currency: z.string().min(3).max(3),
    icon: z.string().max(64).optional().nullable(),
    color: z.string().max(16).optional().nullable(),
    creditLimit: z.number().optional().nullable(),
    statementDay: z.number().optional().nullable(),
    paymentDueDay: z.number().optional().nullable(),
    minInstallmentAmt: z.number().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.type !== "creditCard") return;

    if (data.creditLimit == null || data.creditLimit <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "Vui lòng nhập hạn mức",
        path: ["creditLimit"],
      });
    }
    if (
      data.statementDay == null ||
      Number.isNaN(data.statementDay) ||
      data.statementDay < 1 ||
      data.statementDay > 31
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Từ 1 đến 31",
        path: ["statementDay"],
      });
    }
    if (
      data.paymentDueDay == null ||
      Number.isNaN(data.paymentDueDay) ||
      data.paymentDueDay < 1 ||
      data.paymentDueDay > 60
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Từ 1 đến 60",
        path: ["paymentDueDay"],
      });
    }
    if (
      data.minInstallmentAmt != null &&
      !Number.isNaN(data.minInstallmentAmt) &&
      data.minInstallmentAmt <= 0
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Nhập số dương hoặc để trống",
        path: ["minInstallmentAmt"],
      });
    }
  });

type SourceFormValues = z.infer<typeof sourceFormSchema>;

const SOURCE_TYPE_OPTIONS: { value: FinSourceType; label: string }[] = [
  { value: "cash", label: "Tiền mặt" },
  { value: "bankAccount", label: "Ngân hàng" },
  { value: "creditCard", label: "Thẻ tín dụng" },
  { value: "eWallet", label: "Ví điện tử" },
  { value: "investment", label: "Đầu tư" },
];

export const SOURCE_COLOR_PRESETS = [
  "#b08968",
  "#71896b",
  "#6b8cae",
  "#9b7eb3",
  "#c17b7b",
  "#5a9ea8",
  "#a8946a",
  "#7a6b9c",
];

const EMOJI_PRESETS = [
  "💵",
  "🏦",
  "💳",
  "📱",
  "📈",
  "💰",
  "🪙",
  "💸",
  "🏧",
  "🛒",
];

const selectClassName = cn(
  "h-10 w-full rounded-button border border-warm-200 bg-warm-50 px-3 text-sm text-warm-900",
  "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30");

export type SourceFormProps = {
  mode: "create" | "edit";
  initial?: FinSource | null;
  onFinished: () => void;
};

function defaultValuesFromSource(
  row: FinSource | null | undefined): SourceFormValues {
  if (!row) {
    return {
      name: "",
      type: "cash",
      currency: "VND",
      icon: "💰",
      color: SOURCE_COLOR_PRESETS[0] ?? "#b08968",
      creditLimit: null,
      statementDay: null,
      paymentDueDay: null,
      minInstallmentAmt: null,
    };
  }
  return {
    name: row.name,
    type: row.type,
    currency: row.currency || "VND",
    icon: row.icon ?? "💰",
    color: row.color ?? SOURCE_COLOR_PRESETS[0] ?? "#b08968",
    creditLimit: row.creditLimit ?? null,
    statementDay: row.statementDay ?? null,
    paymentDueDay: row.paymentDueDay ?? null,
    minInstallmentAmt: row.minInstallmentAmt ?? null,
  };
}

export function SourceForm({
  mode,
  initial,
  onFinished,
}: SourceFormProps) {
  const createM = useCreateSource();
  const updateM = useUpdateSource();

  const defaults = useMemo(
    () => defaultValuesFromSource(mode === "edit" ? initial : null),
    [mode, initial]);

  const form = useForm<SourceFormValues>({
    resolver: zodResolver(sourceFormSchema),
    defaultValues: defaults,
    values: defaults,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = form;

  const type = watch("type");
  const currency = watch("currency");
  const colorValue = watch("color");
  const iconValue = watch("icon");

  const pending = createM.isPending || updateM.isPending;

  const onSubmit = handleSubmit(
    async (values) => {
      const isCard = values.type === "creditCard";
      if (mode === "create") {
        await createM.mutateAsync({
          name: values.name,
          type: values.type,
          currency: values.currency,
          icon: values.icon,
          color: values.color,
          creditLimit: isCard ? values.creditLimit : null,
          statementDay: isCard ? values.statementDay : null,
          paymentDueDay: isCard ? values.paymentDueDay : null,
          minInstallmentAmt:
            isCard &&
            values.minInstallmentAmt != null &&
            values.minInstallmentAmt > 0
              ? values.minInstallmentAmt
              : null,
        });
      } else if (initial) {
        await updateM.mutateAsync({
          id: initial.id,
          body: {
            name: values.name,
            type: values.type,
            currency: values.currency,
            icon: values.icon,
            color: values.color,
            creditLimit: isCard ? values.creditLimit : null,
            statementDay: isCard ? values.statementDay : null,
            paymentDueDay: isCard ? values.paymentDueDay : null,
            minInstallmentAmt:
              isCard &&
              values.minInstallmentAmt != null &&
              values.minInstallmentAmt > 0
                ? values.minInstallmentAmt
                : null,
          },
        });
      }
      onFinished();
    },
    (errs) => scrollFirstHookFormErrorIntoView(errs, form));

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <label
          htmlFor="source-type"
          className="mb-1 block text-sm font-medium text-warm-700"
        >
          Loại nguồn
        </label>
        <select
          id="source-type"
          className={selectClassName}
          {...register("type")}
        >
          {SOURCE_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {errors.type ? (
          <p className="mt-1 text-sm text-danger">{errors.type.message}</p>
        ) : null}
      </div>

      <Input
        label="Tên"
        placeholder="Ví dụ: Tiền mặt nhà"
        {...register("name")}
        error={errors.name?.message}
      />

      <div>
        <label
          htmlFor="source-currency"
          className="mb-1 block text-sm font-medium text-warm-700"
        >
          Tiền tệ
        </label>
        <select
          id="source-currency"
          className={selectClassName}
          {...register("currency")}
        >
          <option value="VND">VND</option>
          <option value="USD">USD</option>
        </select>
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium text-warm-700">
          Icon
        </span>
        <div className="flex flex-wrap gap-1.5">
          {EMOJI_PRESETS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setValue("icon", e, { shouldValidate: true })}
              className={cn(
                "flex size-10 items-center justify-center rounded-button border text-lg transition-colors",
                iconValue === e
                  ? "border-accent bg-accent/10"
                  : "border-warm-200 bg-warm-50 hover:border-warm-300")}
              aria-label={e}
            >
              {e}
            </button>
          ))}
        </div>
        <input type="hidden" {...register("icon")} />
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-medium text-warm-700">
          Màu nền thẻ
        </legend>
        <div className="flex flex-wrap gap-2">
          {SOURCE_COLOR_PRESETS.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => setValue("color", hex, { shouldValidate: true })}
              className={cn(
                "size-8 rounded-full border-2 shadow-sm transition-transform",
                colorValue === hex
                  ? "border-warm-900 scale-110"
                  : "border-transparent ring-1 ring-warm-200")}
              style={{ backgroundColor: hex }}
              aria-label={`Màu ${hex}`}
            />
          ))}
        </div>
        <input type="hidden" {...register("color")} />
      </fieldset>

      {type === "creditCard" ? (
        <div className="space-y-4 rounded-card border border-warm-200 bg-warm-25/80 p-4">
          <p className="text-sm font-medium text-warm-800">Thông tin thẻ</p>
          <Controller
            name="creditLimit"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                label="Hạn mức tín dụng"
                value={field.value ?? 0}
                onChange={field.onChange}
                currency={currency}
                error={errors.creditLimit?.message}
                required
              />
            )}
          />
          <Input
            label="Ngày sao kê (1–31)"
            type="number"
            min={1}
            max={31}
            {...register("statementDay", {
              setValueAs: (v) => {
                if (v === "" || v === undefined) return null;
                const n = Number(v);
                return Number.isFinite(n) ? n : null;
              },
            })}
            error={errors.statementDay?.message}
          />
          <Input
            label="Ngày đến hạn thanh toán (1–60)"
            type="number"
            min={1}
            max={60}
            {...register("paymentDueDay", {
              setValueAs: (v) => {
                if (v === "" || v === undefined) return null;
                const n = Number(v);
                return Number.isFinite(n) ? n : null;
              },
            })}
            error={errors.paymentDueDay?.message}
          />
          <Controller
            name="minInstallmentAmt"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                label="Trả góp tối thiểu (tùy chọn)"
                value={field.value ?? 0}
                onChange={field.onChange}
                currency={currency}
                error={errors.minInstallmentAmt?.message}
              />
            )}
          />
        </div>
      ) : null}

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onFinished}
          disabled={pending}
        >
          Hủy
        </Button>
        <Button type="submit" isLoading={pending} disabled={pending || !isDirty}>
          {mode === "create" ? "Tạo nguồn" : "Lưu thay đổi"}
        </Button>
      </div>
    </form>
  );
}
