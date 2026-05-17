"use client";

import { subDays } from "date-fns";
import { Controller, useFormContext } from "react-hook-form";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";

import type { FinSource } from "@/features/sources/types";
import { CurrencyInput } from "@/shared/components/ui/CurrencyInput";
import { formatCurrency } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";

import type { TransactionFormValues } from "./transactionFormSchema";

export interface BaseFieldsProps {
  sources?: FinSource[];
  disabled?: boolean;
  currency: string;
  className?: string;
}

export function BaseFields({
  sources,
  disabled,
  currency,
  className,
}: BaseFieldsProps) {
  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<TransactionFormValues>();
  const dateErr = errors.txnDate?.message as string | undefined;
  const sourceErr = errors.sourceId?.message as string | undefined;
  const noteWatch = watch("note") ?? "";
  const sourceIdWatch = watch("sourceId");

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <Controller
        name="amount"
        control={control}
        render={({ field }) => (
          <CurrencyInput
            currency={currency}
            value={field.value}
            onChange={field.onChange}
            disabled={disabled}
            label="Số tiền"
            className={cn("[&_input]:h-14 [&_input]:text-center [&_input]:text-2xl [&_input]:font-semibold")}
            error={errors.amount?.message as string | undefined}
            required
          />
        )}
      />

      <div>
        <label className="mb-1 block text-sm font-medium text-warm-700">
          Nguồn tiền
        </label>
        <Controller
          name="sourceId"
          control={control}
          render={({ field }) => (
            <SelectPrimitive.Root
              value={field.value || "__none__"}
              onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
              disabled={disabled || !sources?.length}
            >
              <SelectPrimitive.Trigger
                className={cn(
                  "flex h-11 w-full items-center justify-between gap-2 rounded-button border px-3 text-left text-sm",
                  sourceErr ? "border-danger" : "border-warm-200",
                  "bg-warm-50 text-warm-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                <span className="min-w-0 flex-1 truncate">
                  {!field.value?.length ? (
                    <span className="text-warm-400">Chọn nguồn</span>
                  ) : (
                    (() => {
                      const row = sources?.find((s) => s.id === field.value);
                      const bal = row
                        ? formatCurrency(row.balance, row.currency)
                        : "";
                      const label = row
                        ? `${row.name}${bal ? ` (${bal})` : ""}`
                        : "—";
                      return (
                        <span className="text-warm-900" title={label}>
                          {label}
                        </span>
                      );
                    })()
                  )}
                </span>
                <ChevronDown className="size-4 shrink-0 text-warm-500" />
              </SelectPrimitive.Trigger>
              <SelectPrimitive.Portal>
                <SelectPrimitive.Content
                  sideOffset={4}
                  position="popper"
                  className={cn(
                    "z-[120] max-h-[280px] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-button border border-warm-200 bg-warm-50 shadow-lg",
                  )}
                >
                  <SelectPrimitive.Viewport className="max-h-[260px] overflow-y-auto p-1">
                    <SelectPrimitive.Item
                      value="__none__"
                      className={cn(
                        "relative cursor-pointer rounded-md px-3 py-2 text-sm outline-none data-[highlighted]:bg-warm-100 data-[disabled]:opacity-60",
                      )}
                    >
                      <SelectPrimitive.ItemText>
                        Chọn nguồn
                      </SelectPrimitive.ItemText>
                    </SelectPrimitive.Item>
                    {(sources ?? []).map((s) => {
                      const sel = sourceIdWatch === s.id;
                      return (
                        <SelectPrimitive.Item
                          key={s.id}
                          value={s.id}
                          className={cn(
                            "relative cursor-pointer rounded-md px-3 py-2 text-sm outline-none data-[highlighted]:bg-warm-100 data-[state=checked]:bg-accent/10",
                            sel && "font-semibold text-accent-dark",
                          )}
                        >
                          <SelectPrimitive.ItemText>
                            <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                              <span className="min-w-0 truncate">{s.name}</span>
                              <span className="shrink-0 font-mono text-xs text-warm-600">
                                {formatCurrency(s.balance, s.currency)}
                              </span>
                            </span>
                          </SelectPrimitive.ItemText>
                        </SelectPrimitive.Item>
                      );
                    })}
                  </SelectPrimitive.Viewport>
                </SelectPrimitive.Content>
              </SelectPrimitive.Portal>
            </SelectPrimitive.Root>
          )}
        />
        {sourceErr ? (
          <p className="mt-1 text-sm text-danger">{sourceErr}</p>
        ) : null}
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
          <label htmlFor="txn-date" className="text-sm font-medium text-warm-700">
            Ngày giao dịch
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() =>
                setValue("txnDate", formatYmdLocal(new Date()), {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              className="rounded-md border border-warm-200 bg-white px-2.5 py-1 text-xs font-medium text-warm-700 transition hover:bg-warm-50 disabled:opacity-50"
            >
              Hôm nay
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() =>
                setValue("txnDate", formatYmdLocal(subDays(new Date(), 1)), {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              className="rounded-md border border-warm-200 bg-white px-2.5 py-1 text-xs font-medium text-warm-700 transition hover:bg-warm-50 disabled:opacity-50"
            >
              Hôm qua
            </button>
          </div>
        </div>
        <Controller
          name="txnDate"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              id="txn-date"
              type="date"
              disabled={disabled}
              className={cn(
                "h-11 w-full rounded-button border bg-warm-50 px-3 text-sm font-mono text-warm-900",
                dateErr ? "border-danger" : "border-warm-200",
                "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60",
              )}
              aria-invalid={dateErr ? true : undefined}
            />
          )}
        />
        {dateErr ? (
          <p className="mt-1 text-sm text-danger">{dateErr}</p>
        ) : null}
      </div>

      <div>
        <div className="mb-2 flex justify-between gap-2">
          <label htmlFor="txn-note" className="text-sm font-medium text-warm-700">
            Ghi chú <span className="font-normal text-warm-500">(không bắt buộc)</span>
          </label>
          <span className="text-xs tabular-nums text-warm-500">
            {noteWatch.length}/500
          </span>
        </div>
        <Controller
          name="note"
          control={control}
          render={({ field }) => (
            <textarea
              {...field}
              id="txn-note"
              disabled={disabled}
              maxLength={500}
              rows={3}
              placeholder="Chi tiết, địa điểm…"
              className={cn(
                "w-full resize-y rounded-button border px-3 py-2 text-sm text-warm-900 placeholder:text-warm-400",
                errors.note?.message ? "border-danger" : "border-warm-200",
                "bg-warm-50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60",
              )}
            />
          )}
        />
        {errors.note?.message ? (
          <p className="mt-1 text-sm text-danger">{String(errors.note.message)}</p>
        ) : null}
      </div>
    </div>
  );
}

function formatYmdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}
