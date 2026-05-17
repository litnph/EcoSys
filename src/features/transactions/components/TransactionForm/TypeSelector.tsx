"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import * as Tabs from "@radix-ui/react-tabs";
import {
  ArrowLeftRight,
  CreditCard,
  ChevronDown,
  Download,
  HandCoins,
  RotateCcw,
  Send,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { useMediaMd } from "@/shared/hooks/useMediaMd";
import { cn } from "@/shared/lib/utils";

import type { TransactionCreateFormType } from "./transactionFormSchema";

const META: Record<TransactionCreateFormType, { icon: LucideIcon }> = {
  direct: { icon: ShoppingCart },
  income: { icon: TrendingUp },
  transfer: { icon: ArrowLeftRight },
  deferred: { icon: CreditCard },
  split: { icon: Users },
  debt_borrow: { icon: HandCoins },
  debt_repay: { icon: RotateCcw },
  loan_give: { icon: Send },
  loan_collect: { icon: Download },
};

export const TYPE_ORDER = [
  "direct",
  "income",
  "transfer",
  "deferred",
  "split",
  "debt_borrow",
  "debt_repay",
  "loan_give",
  "loan_collect",
] as const satisfies TransactionCreateFormType[];

export interface TypeSelectorProps {
  value: TransactionCreateFormType;
  onChange: (next: TransactionCreateFormType) => void;
  disabled?: boolean;
  className?: string;
}

export function TypeSelector({
  value,
  onChange,
  disabled,
  className,
}: TypeSelectorProps) {
  const mdUp = useMediaMd();
  const t = useTranslations("transaction");

  const typeMsgKey = {
    direct: "types.direct",
    income: "types.income",
    transfer: "types.transfer",
    deferred: "types.deferred",
    split: "types.split",
    debt_borrow: "types.debt_borrow",
    debt_repay: "types.debt_repay",
    loan_give: "types.loan_give",
    loan_collect: "types.loan_collect",
  } as const satisfies Record<TransactionCreateFormType, string>;
  const labelFor = (txType: TransactionCreateFormType) =>
    t(typeMsgKey[txType]);

  if (!mdUp) {
    const meta = META[value];
    const Icon = meta.icon;
    return (
      <div className={cn("w-full", className)}>
        <label className="mb-2 block text-sm font-medium text-warm-700">
          {t("formTypeLabel")}
        </label>
        <SelectPrimitive.Root
          value={value}
          onValueChange={(v) => onChange(v as TransactionCreateFormType)}
          disabled={disabled}
        >
          <SelectPrimitive.Trigger
            className={cn(
              "flex h-11 w-full items-center justify-between gap-2 rounded-button border bg-warm-50 px-3 text-sm text-warm-900",
              "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30",
              "disabled:cursor-not-allowed disabled:opacity-60",
              "border-warm-200",
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <Icon className="size-4 shrink-0 text-warm-600" aria-hidden />
              <span className="truncate font-medium">{labelFor(value)}</span>
            </span>
            <ChevronDown className="size-4 shrink-0 text-warm-500" aria-hidden />
          </SelectPrimitive.Trigger>
          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              position="popper"
              className={cn(
                "z-[120] max-h-[min(400px,var(--radix-select-content-available-height))] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-button border border-warm-200 bg-warm-50 shadow-lg",
              )}
              sideOffset={4}
            >
              <SelectPrimitive.Viewport className="max-h-[320px] overflow-y-auto p-1">
                {TYPE_ORDER.map((txType) => {
                  const m = META[txType];
                  const I = m.icon;
                  return (
                    <SelectPrimitive.Item
                      key={txType}
                      value={txType}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2.5 text-sm outline-none data-[highlighted]:bg-warm-100 data-[state=checked]:bg-accent/15",
                      )}
                    >
                      <SelectPrimitive.ItemText className="flex items-center gap-2">
                        <I className="size-4 text-warm-600" aria-hidden />
                        <span>{labelFor(txType)}</span>
                      </SelectPrimitive.ItemText>
                    </SelectPrimitive.Item>
                  );
                })}
              </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <Tabs.Root
        value={value}
        onValueChange={(next) =>
          TYPE_ORDER.some((item) => item === next as TransactionCreateFormType)
            ? onChange(next as TransactionCreateFormType)
            : undefined
        }
        orientation="horizontal"
      >
        <Tabs.List className="inline-flex max-w-full gap-1 overflow-x-auto rounded-button border border-warm-200 bg-warm-25 p-1">
          {TYPE_ORDER.map((txType) => {
            const m = META[txType];
            const I = m.icon;
            const active = value === txType;
            return (
              <Tabs.Trigger
                key={txType}
                value={txType}
                disabled={disabled}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-semibold outline-none transition md:text-sm",
                  active
                    ? "bg-surface text-warm-900 shadow-sm ring-1 ring-accent/30"
                    : "bg-transparent text-warm-600 hover:bg-warm-50 hover:text-warm-900",
                  "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                <I className="size-4 shrink-0 text-warm-600" aria-hidden />
                <span className="whitespace-nowrap">{labelFor(txType)}</span>
              </Tabs.Trigger>
            );
          })}
        </Tabs.List>
      </Tabs.Root>
    </div>
  );
}
