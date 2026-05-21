"use client";

import * as Tabs from "@radix-ui/react-tabs";
import {
  ArrowLeftRight,
  CreditCard,
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
                  "disabled:cursor-not-allowed disabled:opacity-50")}
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
