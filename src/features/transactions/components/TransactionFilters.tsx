import * as Popover from "@radix-ui/react-popover";
import {
  Check,
  ChevronDown,
  CircleDot,
  MoreHorizontal,
  SlidersHorizontal,
  Wallet,
  X,
} from "lucide-react";
import { useTranslations } from "@/i18n/hooks";
import { useLocale } from "@/i18n/navigation";
import { enUS, vi as viDates } from "date-fns/locale";
import * as React from "react";

import type { FinSource } from "@/features/sources/types";
import { cn } from "@/shared/lib/utils";
import { formatCurrency } from "@/shared/lib/formatters";

import type { TransactionFilterState, TxnStatus } from "../types";
import {
  countActiveFilters,
  DEFAULT_TXN_STATUS,
} from "../utils/filterState";
import {
  billingPeriodLabel,
  billingPeriodOptions,
  currentBillingPeriodKey,
} from "../utils/periodFilter";
import {
  transactionTypeLabel,
  txnStatusLabel,
} from "../utils/txnDisplay";

import { TransactionMoreFiltersModal } from "./TransactionMoreFiltersModal";

function filterTriggerClass(active: boolean): string {
  return cn(
    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition",
    active
      ? "border-accent/40 bg-accent/10 text-accent-emphasis"
      : "border-warm-200 bg-surface text-warm-700 hover:border-warm-300 hover:bg-warm-50",
  );
}

function ActiveChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-md border border-accent/25 bg-accent/10 py-0.5 pl-2 pr-0.5 text-xs text-accent-emphasis">
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="rounded p-0.5 text-warm-500 hover:bg-warm-100 hover:text-warm-800"
        aria-label={`Bỏ lọc ${label}`}
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </span>
  );
}

type StatusFilterValue = TxnStatus | "all";

const STATUS_OPTIONS: Array<{ value: StatusFilterValue; label: string }> = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "new", label: "Giao dịch mới" },
  { value: "transferredToInstallment", label: "Đã chuyển trả góp" },
  { value: "statemented", label: "Đã sao kê" },
  { value: "completed", label: "Hoàn thành" },
];

export interface TransactionFiltersProps {
  sources: FinSource[] | undefined;
  value: TransactionFilterState;
  onChange: (next: TransactionFilterState) => void;
  className?: string;
}

export function TransactionFilters({
  sources,
  value,
  onChange,
  className,
}: TransactionFiltersProps) {
  const t = useTranslations("filters");
  const tTx = useTranslations("transaction");
  const locale = useLocale();
  const dateLocale = locale === "vi" ? viDates : enUS;

  const [sourceOpen, setSourceOpen] = React.useState(false);
  const [statusOpen, setStatusOpen] = React.useState(false);
  const [moreOpen, setMoreOpen] = React.useState(false);

  const periodOptions = React.useMemo(() => billingPeriodOptions(), []);
  const active = countActiveFilters(value);

  const toggleSource = (id: string) => {
    const set = new Set(value.sourceIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange({ ...value, sourceIds: Array.from(set) });
  };

  const sourceSummary =
    value.sourceIds.length === 0
      ? t("allSources")
      : value.sourceIds.length === 1
        ? (sources?.find((s) => s.id === value.sourceIds[0])?.name ??
          t("oneSource"))
        : t("nSources", { count: value.sourceIds.length });

  const statusSummary = !value.status
    ? "Tất cả trạng thái"
    : txnStatusLabel(value.status);

  const periodSelectValue =
    value.billingPeriod === "custom" ? "custom" : value.billingPeriod;

  const periodDisplayLabel =
    value.billingPeriod === "custom"
      ? billingPeriodLabel("custom", locale)
      : billingPeriodLabel(value.billingPeriod, locale);

  const hasMoreActive =
    value.types.length > 0 ||
    Boolean(value.parentCategoryId) ||
    Boolean(value.categoryId) ||
    (typeof value.amountMin === "number" && value.amountMin > 0) ||
    (typeof value.amountMax === "number" && value.amountMax > 0) ||
    value.groupBy !== "none" ||
    value.sortBy !== "dateDesc" ||
    value.billingPeriod === "custom";

  return (
    <section className={cn("space-y-2.5", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[8.5rem] shrink-0">
          <select
            value={periodSelectValue}
            onChange={(e) => {
              const next = e.target.value;
              if (next === "custom") return;
              onChange({
                ...value,
                billingPeriod: next,
                dateFrom: undefined,
                dateTo: undefined,
              });
            }}
            className={cn(
              filterTriggerClass(
                value.billingPeriod === "all" ||
                  value.billingPeriod === "custom" ||
                  value.billingPeriod !== currentBillingPeriodKey(),
              ),
              "h-8 w-full appearance-none pr-7")}
            aria-label={t("billingPeriod")}
          >
            {periodOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {locale === "vi" ? opt.labelVi : opt.labelEn}
              </option>
            ))}
            {value.billingPeriod === "custom" ? (
              <option value="custom">{periodDisplayLabel}</option>
            ) : null}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-warm-400"
            aria-hidden
          />
        </div>

        <Popover.Root open={sourceOpen} onOpenChange={setSourceOpen}>
          <Popover.Trigger asChild>
            <button
              type="button"
              className={filterTriggerClass(value.sourceIds.length > 0)}
            >
              <Wallet className="size-3.5 shrink-0 opacity-70" />
              <span className="max-w-[7rem] truncate">{sourceSummary}</span>
              <ChevronDown className="size-3 opacity-60" />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              align="start"
              side="bottom"
              className="z-[120] w-[min(100vw-2rem,300px)] rounded-card border border-warm-200 bg-surface p-2 shadow-lg"
              sideOffset={6}
            >
              <ul className="max-h-52 space-y-0.5 overflow-y-auto">
                {(sources ?? []).map((s) => {
                  const checked = value.sourceIds.includes(s.id);
                  return (
                    <li key={s.id}>
                      <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-warm-100">
                        <input
                          type="checkbox"
                          className="size-3.5 rounded border-warm-300 accent-accent"
                          checked={checked}
                          onChange={() => toggleSource(s.id)}
                        />
                        <span className="min-w-0 truncate">{s.name}</span>
                        {checked ? (
                          <Check className="ml-auto size-3.5 text-accent" />
                        ) : null}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        <Popover.Root open={statusOpen} onOpenChange={setStatusOpen}>
          <Popover.Trigger asChild>
            <button
              type="button"
              className={filterTriggerClass(
                Boolean(value.status && value.status !== DEFAULT_TXN_STATUS),
              )}
            >
              <CircleDot className="size-3.5 shrink-0 opacity-70" />
              <span className="max-w-[8rem] truncate">{statusSummary}</span>
              <ChevronDown className="size-3 opacity-60" />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              align="start"
              className="z-[120] w-[min(100vw-2rem,280px)] rounded-card border border-warm-200 bg-surface p-2 shadow-lg"
              sideOffset={6}
            >
              <ul className="space-y-0.5">
                {STATUS_OPTIONS.map(({ value: opt, label }) => {
                  const selected =
                    opt === "all" ? !value.status : value.status === opt;
                  return (
                    <li key={opt}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange({
                            ...value,
                            status: opt === "all" ? undefined : opt,
                          });
                          setStatusOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-warm-100",
                          selected &&
                            "bg-accent/10 font-medium text-accent-emphasis",
                        )}
                      >
                        <span className="flex-1">{label}</span>
                        {selected ? (
                          <Check className="size-3.5 text-accent" />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        <button
          type="button"
          className={filterTriggerClass(hasMoreActive)}
          onClick={() => setMoreOpen(true)}
        >
          <SlidersHorizontal className="size-3.5 shrink-0 opacity-70" />
          <span>{t("moreFilters")}</span>
        </button>
      </div>

      {active > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-warm-500">
            <MoreHorizontal className="size-3" aria-hidden />
            {t("activeFilters")}
          </span>
          {value.billingPeriod === "all" ||
          value.billingPeriod === "custom" ||
          value.billingPeriod !== currentBillingPeriodKey() ? (
            <ActiveChip
              label={periodDisplayLabel}
              onRemove={() =>
                onChange({
                  ...value,
                  billingPeriod: currentBillingPeriodKey(),
                  dateFrom: undefined,
                  dateTo: undefined,
                })
              }
            />
          ) : null}
          {value.sourceIds.map((id) => {
            const name = sources?.find((s) => s.id === id)?.name ?? id;
            return (
              <ActiveChip
                key={id}
                label={name}
                onRemove={() => toggleSource(id)}
              />
            );
          })}
          {value.types.map((ty) => (
            <ActiveChip
              key={ty}
              label={transactionTypeLabel(ty, tTx)}
              onRemove={() => {
                onChange({
                  ...value,
                  types: value.types.filter((x) => x !== ty),
                });
              }}
            />
          ))}
          {value.status && value.status !== DEFAULT_TXN_STATUS ? (
            <ActiveChip
              label={txnStatusLabel(value.status)}
              onRemove={() =>
                onChange({ ...value, status: DEFAULT_TXN_STATUS })
              }
            />
          ) : null}
          {value.groupBy !== "none" ? (
            <ActiveChip
              label="Nhóm theo ngày"
              onRemove={() => onChange({ ...value, groupBy: "none" })}
            />
          ) : null}
          {typeof value.amountMin === "number" && value.amountMin > 0 ? (
            <ActiveChip
              label={`≥ ${formatCurrency(value.amountMin)}`}
              onRemove={() =>
                onChange({ ...value, amountMin: undefined })
              }
            />
          ) : null}
          {typeof value.amountMax === "number" && value.amountMax > 0 ? (
            <ActiveChip
              label={`≤ ${formatCurrency(value.amountMax)}`}
              onRemove={() =>
                onChange({ ...value, amountMax: undefined })
              }
            />
          ) : null}
        </div>
      ) : null}

      <TransactionMoreFiltersModal
        isOpen={moreOpen}
        onClose={() => setMoreOpen(false)}
        value={value}
        onChange={onChange}
        dateLocale={dateLocale}
        tFilters={t}
        tTx={tTx}
      />
    </section>
  );
}
