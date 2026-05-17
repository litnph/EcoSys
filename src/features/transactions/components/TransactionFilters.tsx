"use client";

import * as Popover from "@radix-ui/react-popover";
import {
  CalendarRange,
  Check,
  ChevronDown,
  ChevronUp,
  Filter,
  Tag,
  Wallet,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import { type DateRange } from "react-day-picker";
import { format } from "date-fns";
import { enUS, vi as viDates } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import { SkeletonText } from "@/shared/components/ui/Skeleton";

import { CategorySelector } from "@/features/categories/components/CategorySelector";
import type { FinSource } from "@/features/sources/types";
import { Button } from "@/shared/components/ui/Button";
import { CurrencyInput } from "@/shared/components/ui/CurrencyInput";
import { cn } from "@/shared/lib/utils";

import type { TransactionFilterState, TransactionType } from "../types";
import { TRANSACTION_TYPES } from "../types";
import {
  countActiveFilters,
  defaultTransactionFilterState,
} from "../utils/filterState";
import {
  transactionTypeIcon,
  transactionTypeLabel,
} from "../utils/txnDisplay";

const LazyTransactionDateRangePicker = dynamic(
  () =>
    import("./TransactionDateRangePicker").then(
      (m) => m.TransactionDateRangePicker,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[260px] items-center justify-center rounded-lg bg-warm-50 p-4">
        <SkeletonText className="h-52 w-full max-w-[280px] rounded-lg" />
      </div>
    ),
  },
);

export interface TransactionFiltersProps {
  smoduleId: string | undefined;
  sources: FinSource[] | undefined;
  value: TransactionFilterState;
  onChange: (next: TransactionFilterState) => void;
  className?: string;
}

export function TransactionFilters({
  smoduleId,
  sources,
  value,
  onChange,
  className,
}: TransactionFiltersProps) {
  const t = useTranslations("filters");
  const tTx = useTranslations("transaction");
  const locale = useLocale();
  const dateLocale = locale === "vi" ? viDates : enUS;

  const [expanded, setExpanded] = React.useState(false);
  const [dateOpen, setDateOpen] = React.useState(false);
  const [sourceOpen, setSourceOpen] = React.useState(false);
  const [typeOpen, setTypeOpen] = React.useState(false);

  const range: DateRange | undefined =
    value.dateFrom || value.dateTo
      ? {
          from: value.dateFrom ? new Date(`${value.dateFrom}T00:00:00`) : undefined,
          to: value.dateTo ? new Date(`${value.dateTo}T00:00:00`) : undefined,
        }
      : undefined;

  const active = countActiveFilters(value);

  const toggleSource = (id: string) => {
    const set = new Set(value.sourceIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange({ ...value, sourceIds: Array.from(set) });
  };

  const toggleType = (ty: TransactionType) => {
    const set = new Set(value.types);
    if (set.has(ty)) set.delete(ty);
    else set.add(ty);
    onChange({ ...value, types: Array.from(set) as TransactionType[] });
  };

  const reset = () => {
    onChange(defaultTransactionFilterState());
  };

  const sourceSummary =
    value.sourceIds.length === 0
      ? t("allSources")
      : value.sourceIds.length === 1
        ? sources?.find((s) => s.id === value.sourceIds[0])?.name ??
          t("oneSource")
        : t("nSources", { count: value.sourceIds.length });

  const typeSummary =
    value.types.length === 0
      ? t("allTypes")
      : value.types.length === 1
        ? transactionTypeLabel(value.types[0]!, tTx)
        : t("nTypes", { count: value.types.length });

  return (
    <section
      className={cn(
        "rounded-card border border-warm-200 bg-surface shadow-sm",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-warm-50"
      >
        <span className="flex items-center gap-2 font-medium text-warm-900">
          <Filter className="size-4 text-warm-600" aria-hidden />
          {t("title")}
          {active > 0 ? (
            <span className="rounded-badge bg-accent/20 px-2 py-0.5 text-xs font-semibold text-accent-dark">
              {active}
            </span>
          ) : null}
        </span>
        {expanded ? (
          <ChevronUp className="size-5 shrink-0 text-warm-500" />
        ) : (
          <ChevronDown className="size-5 shrink-0 text-warm-500" />
        )}
      </button>

      {expanded ? (
        <div className="space-y-4 border-t border-warm-100 px-4 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Popover.Root open={dateOpen} onOpenChange={setDateOpen}>
              <Popover.Trigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex h-10 w-full items-center gap-2 rounded-button border bg-warm-50 px-3 text-left text-sm",
                    value.dateFrom || value.dateTo
                      ? "border-accent text-warm-900"
                      : "border-warm-200 text-warm-700",
                  )}
                >
                  <CalendarRange className="size-4 shrink-0 text-warm-500" />
                  <span className="truncate">
                    {value.dateFrom && value.dateTo
                      ? `${format(new Date(`${value.dateFrom}T00:00:00`), "dd/MM/yyyy", { locale: dateLocale })} – ${format(new Date(`${value.dateTo}T00:00:00`), "dd/MM/yyyy", { locale: dateLocale })}`
                      : value.dateFrom
                        ? t("dateFrom", {
                            date: format(
                              new Date(`${value.dateFrom}T00:00:00`),
                              "dd/MM/yyyy",
                              { locale: dateLocale },
                            ),
                          })
                        : t("dateRange")}
                  </span>
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  side="bottom"
                  align="start"
                  className="z-[120] rounded-card border border-warm-200 bg-surface p-3 shadow-lg"
                  sideOffset={6}
                >
                  <LazyTransactionDateRangePicker
                    range={range}
                    dateLocale={dateLocale}
                    onApplyRange={(partial) =>
                      onChange({
                        ...value,
                        ...partial,
                      })
                    }
                    onClear={() => setDateOpen(false)}
                    onDone={() => setDateOpen(false)}
                    labels={{ clearDates: t("clearDates"), done: t("done") }}
                  />
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>

            <Popover.Root open={sourceOpen} onOpenChange={setSourceOpen}>
              <Popover.Trigger asChild>
                <button
                  type="button"
                  className="flex h-10 w-full items-center gap-2 rounded-button border border-warm-200 bg-warm-50 px-3 text-left text-sm text-warm-900"
                >
                  <Wallet className="size-4 shrink-0 text-warm-500" />
                  <span className="truncate">{sourceSummary}</span>
                  <ChevronDown className="ml-auto size-4 text-warm-500" />
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  align="start"
                  side="bottom"
                  className="z-[120] w-[min(100vw-2rem,320px)] rounded-card border border-warm-200 bg-surface p-2 shadow-lg"
                  sideOffset={6}
                >
                  <ul className="max-h-56 space-y-1 overflow-y-auto">
                    {(sources ?? []).map((s) => {
                      const checked = value.sourceIds.includes(s.id);
                      return (
                        <li key={s.id}>
                          <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-warm-100">
                            <input
                              type="checkbox"
                              className="size-4 rounded border-warm-300"
                              checked={checked}
                              onChange={() => toggleSource(s.id)}
                            />
                            <span className="min-w-0 truncate">{s.name}</span>
                            {checked ? (
                              <Check className="ml-auto size-4 text-accent" />
                            ) : null}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          </div>

          <Popover.Root open={typeOpen} onOpenChange={setTypeOpen}>
            <Popover.Trigger asChild>
              <button
                type="button"
                className="flex h-10 w-full items-center gap-2 rounded-button border border-warm-200 bg-warm-50 px-3 text-left text-sm text-warm-900"
              >
                <Tag className="size-4 shrink-0 text-warm-500" />
                <span className="truncate">{typeSummary}</span>
                <ChevronDown className="ml-auto size-4 text-warm-500" />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                align="start"
                className="z-[120] w-[min(100vw-2rem,360px)] max-h-[min(420px,70vh)] overflow-y-auto rounded-card border border-warm-200 bg-surface p-2 shadow-lg"
                sideOffset={6}
              >
                <ul className="space-y-1">
                  {TRANSACTION_TYPES.filter((ty) => ty !== "reversal").map((ty) => {
                    const Icon = transactionTypeIcon(ty);
                    const checked = value.types.includes(ty);
                    return (
                      <li key={ty}>
                        <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-warm-100">
                          <input
                            type="checkbox"
                            className="size-4 rounded border-warm-300"
                            checked={checked}
                            onChange={() => toggleType(ty)}
                          />
                          <Icon className="size-4 shrink-0 text-warm-600" />
                          <span className="flex-1">{transactionTypeLabel(ty, tTx)}</span>
                          {checked ? (
                            <Check className="size-4 text-accent" />
                          ) : null}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-warm-500">
              {t("categoryLabel")}
            </p>
            <div className="mb-2 flex flex-wrap gap-1">
              {(
                [
                  { k: "expense", l: "categoryKindExpense" as const },
                  { k: "income", l: "categoryKindIncome" as const },
                  { k: "transfer", l: "categoryKindTransfer" as const },
                ] as const
              ).map(({ k, l }) => (
                <button
                  key={k}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...value,
                      categoryKind: k,
                      categoryId: undefined,
                    })
                  }
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition",
                    value.categoryKind === k
                      ? "bg-accent text-white"
                      : "bg-warm-100 text-warm-600 hover:bg-warm-200",
                  )}
                >
                  {t(l)}
                </button>
              ))}
            </div>
            <CategorySelector
              smoduleId={smoduleId}
              value={value.categoryId}
              onChange={(id) =>
                onChange({
                  ...value,
                  categoryId: id,
                })
              }
              kind={value.categoryKind}
              placeholder={t("categoryPlaceholder")}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <CurrencyInput
              label={t("amountMin")}
              value={value.amountMin ?? 0}
              onChange={(n) =>
                onChange({
                  ...value,
                  amountMin: n > 0 ? n : undefined,
                })
              }
            />
            <CurrencyInput
              label={t("amountMax")}
              value={value.amountMax ?? 0}
              onChange={(n) =>
                onChange({
                  ...value,
                  amountMax: n > 0 ? n : undefined,
                })
              }
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leftIcon={<X className="size-4" />}
              onClick={reset}
            >
              {t("reset")}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
