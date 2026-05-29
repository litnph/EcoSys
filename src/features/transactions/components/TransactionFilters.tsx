import * as Popover from "@radix-ui/react-popover";
import {
  CalendarRange,
  Check,
  ChevronDown,
  CircleDot,
  MoreHorizontal,
  SlidersHorizontal,
  Tag,
  Wallet,
  X,
} from "lucide-react";
import { type DateRange } from "react-day-picker";
import { format, subDays } from "date-fns";
import { enUS, vi as viDates } from "date-fns/locale";
import { useTranslations } from "@/i18n/hooks";
import { useLocale } from "@/i18n/navigation";
import * as React from "react";

import { CategorySelector } from "@/features/categories/components/CategorySelector";
import { ParentCategorySelector } from "@/features/categories/components/ParentCategorySelector";
import { useFlatCategories } from "@/features/categories/hooks/useFlatCategories";
import type { FinSource } from "@/features/sources/types";
import { Button } from "@/shared/components/ui/Button";
import { CurrencyInput } from "@/shared/components/ui/CurrencyInput";
import { cn } from "@/shared/lib/utils";
import { formatCurrency } from "@/shared/lib/formatters";

import type { TransactionFilterState, TransactionSortBy, TransactionType, TxnStatus } from "../types";
import { TRANSACTION_TYPES } from "../types";
import {
  countActiveFilters,
  currentMonthRange,
  DEFAULT_TXN_STATUS,
} from "../utils/filterState";
import {
  transactionTypeIcon,
  transactionTypeLabel,
  txnStatusLabel,
} from "../utils/txnDisplay";

import { TransactionDateRangePicker } from "./TransactionDateRangePicker";

type DatePreset = "all" | "month" | "30d";

function isoDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function currentMonthRangeLocal(): { dateFrom: string; dateTo: string } {
  return currentMonthRange();
}

function last30DaysRange(): { dateFrom: string; dateTo: string } {
  const to = new Date();
  const from = subDays(to, 29);
  return { dateFrom: isoDate(from), dateTo: isoDate(to) };
}

function matchesPreset(
  value: TransactionFilterState,
  preset: DatePreset,
): boolean {
  if (preset === "all") return !value.dateFrom && !value.dateTo;
  const target =
    preset === "month" ? currentMonthRangeLocal() : last30DaysRange();
  return (
    value.dateFrom === target.dateFrom && value.dateTo === target.dateTo
  );
}

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

const SORT_OPTIONS: Array<{ value: TransactionSortBy; label: string }> = [
  { value: "dateDesc", label: "Ngày mới nhất" },
  { value: "dateAsc", label: "Ngày cũ nhất" },
  { value: "categoryAsc", label: "Danh mục A→Z" },
  { value: "categoryDesc", label: "Danh mục Z→A" },
  { value: "typeAsc", label: "Nguồn tiền A→Z" },
  { value: "typeDesc", label: "Nguồn tiền Z→A" },
  { value: "amountDesc", label: "Số tiền cao→thấp" },
  { value: "amountAsc", label: "Số tiền thấp→cao" },
];

const STATUS_OPTIONS: Array<{ value: StatusFilterValue; label: string }> = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "new", label: "Giao dịch mới" },
  { value: "transferredToInstallment", label: "Đã chuyển trả góp" },
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

  const [dateOpen, setDateOpen] = React.useState(false);
  const [sourceOpen, setSourceOpen] = React.useState(false);
  const [typeOpen, setTypeOpen] = React.useState(false);
  const [statusOpen, setStatusOpen] = React.useState(false);
  const [moreOpen, setMoreOpen] = React.useState(false);

  const { data: flatCategories } = useFlatCategories(value.categoryKind);
  const parentCategoryLabel = value.parentCategoryId
    ? flatCategories?.find((c) => c.id === value.parentCategoryId)?.name
    : undefined;

  const range: DateRange | undefined =
    value.dateFrom || value.dateTo
      ? {
          from: value.dateFrom
            ? new Date(`${value.dateFrom}T00:00:00`)
            : undefined,
          to: value.dateTo
            ? new Date(`${value.dateTo}T00:00:00`)
            : undefined,
        }
      : undefined;

  const active = countActiveFilters(value);
  const hasDate = Boolean(value.dateFrom || value.dateTo);

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

  const applyDatePreset = (preset: DatePreset) => {
    if (preset === "all") {
      onChange({ ...value, dateFrom: undefined, dateTo: undefined });
      return;
    }
    const r = preset === "month" ? currentMonthRange() : last30DaysRange();
    onChange({ ...value, dateFrom: r.dateFrom, dateTo: r.dateTo });
  };

  const dateLabel =
    value.dateFrom && value.dateTo
      ? `${format(new Date(`${value.dateFrom}T00:00:00`), "dd/MM/yy", { locale: dateLocale })} – ${format(new Date(`${value.dateTo}T00:00:00`), "dd/MM/yy", { locale: dateLocale })}`
      : value.dateFrom
        ? format(
            new Date(`${value.dateFrom}T00:00:00`),
            "dd/MM/yy",
            { locale: dateLocale },
          )
        : t("dateRange");

  const sourceSummary =
    value.sourceIds.length === 0
      ? t("allSources")
      : value.sourceIds.length === 1
        ? (sources?.find((s) => s.id === value.sourceIds[0])?.name ??
          t("oneSource"))
        : t("nSources", { count: value.sourceIds.length });

  const typeSummary =
    value.types.length === 0
      ? t("allTypes")
      : value.types.length === 1
        ? transactionTypeLabel(value.types[0]!, tTx)
        : t("nTypes", { count: value.types.length });

  const statusSummary = !value.status
    ? "Tất cả trạng thái"
    : txnStatusLabel(value.status);

  const hasMoreActive =
    Boolean(value.parentCategoryId) ||
    Boolean(value.categoryId) ||
    (typeof value.amountMin === "number" && value.amountMin > 0) ||
    (typeof value.amountMax === "number" && value.amountMax > 0) ||
    value.groupBy !== "none" ||
    value.sortBy !== "dateDesc";

  const datePresets: { id: DatePreset; label: string }[] = [
    { id: "all", label: t("presetAll") },
    { id: "month", label: t("presetThisMonth") },
    { id: "30d", label: t("presetLast30Days") },
  ];

  return (
    <section className={cn("space-y-2.5", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="inline-flex shrink-0 rounded-lg border border-warm-200 bg-warm-50 p-0.5"
          role="group"
          aria-label={t("datePresets")}
        >
          {datePresets.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => applyDatePreset(id)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition",
                matchesPreset(value, id)
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-warm-600 hover:bg-surface hover:text-warm-900",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <Popover.Root open={dateOpen} onOpenChange={setDateOpen}>
          <Popover.Trigger asChild>
            <button
              type="button"
              className={filterTriggerClass(hasDate)}
              aria-expanded={dateOpen}
            >
              <CalendarRange className="size-3.5 shrink-0 opacity-70" />
              <span className="max-w-[9rem] truncate sm:max-w-[11rem]">
                {dateLabel}
              </span>
              <ChevronDown className="size-3 opacity-60" />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              side="bottom"
              align="start"
              className="z-[120] rounded-card border border-warm-200 bg-surface p-3 shadow-lg"
              sideOffset={6}
            >
              <TransactionDateRangePicker
                range={range}
                dateLocale={dateLocale}
                onApplyRange={(partial) =>
                  onChange({ ...value, ...partial })
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

        <Popover.Root open={typeOpen} onOpenChange={setTypeOpen}>
          <Popover.Trigger asChild>
            <button
              type="button"
              className={filterTriggerClass(value.types.length > 0)}
            >
              <Tag className="size-3.5 shrink-0 opacity-70" />
              <span className="max-w-[7rem] truncate">{typeSummary}</span>
              <ChevronDown className="size-3 opacity-60" />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              align="start"
              className="z-[120] max-h-[min(380px,65vh)] w-[min(100vw-2rem,340px)] overflow-y-auto rounded-card border border-warm-200 bg-surface p-2 shadow-lg"
              sideOffset={6}
            >
              <ul className="space-y-0.5">
                {TRANSACTION_TYPES.filter((ty) => ty !== "reversal").map(
                  (ty) => {
                    const Icon = transactionTypeIcon(ty);
                    const checked = value.types.includes(ty);
                    return (
                      <li key={ty}>
                        <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-warm-100">
                          <input
                            type="checkbox"
                            className="size-3.5 rounded border-warm-300 accent-accent"
                            checked={checked}
                            onChange={() => toggleType(ty)}
                          />
                          <Icon className="size-3.5 shrink-0 text-warm-500" />
                          <span className="flex-1 text-sm">
                            {transactionTypeLabel(ty, tTx)}
                          </span>
                          {checked ? (
                            <Check className="size-3.5 text-accent" />
                          ) : null}
                        </label>
                      </li>
                    );
                  },
                )}
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
                    opt === "all"
                      ? !value.status
                      : value.status === opt;
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
                          selected && "bg-accent/10 font-medium text-accent-emphasis",
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

        <Popover.Root open={moreOpen} onOpenChange={setMoreOpen}>
          <Popover.Trigger asChild>
            <button
              type="button"
              className={filterTriggerClass(hasMoreActive)}
            >
              <SlidersHorizontal className="size-3.5 shrink-0 opacity-70" />
              <span>{t("moreFilters")}</span>
              <ChevronDown className="size-3 opacity-60" />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              align="end"
              side="bottom"
              className="z-[120] w-[min(100vw-2rem,360px)] rounded-card border border-warm-200 bg-surface p-4 shadow-lg"
              sideOffset={6}
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-warm-500">
                Sắp xếp
              </p>
              <select
                value={value.sortBy}
                onChange={(e) =>
                  onChange({
                    ...value,
                    sortBy: e.target.value as TransactionSortBy,
                  })
                }
                className="mb-4 h-9 w-full rounded-md border border-warm-200 bg-warm-50 px-2 text-sm text-warm-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-warm-500">
                Hiển thị
              </p>
              <div className="mb-4 flex flex-wrap gap-1">
                {(
                  [
                    { id: "none", label: "Danh sách phẳng" },
                    { id: "day", label: "Nhóm theo ngày" },
                  ] as const
                ).map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onChange({ ...value, groupBy: id })}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition",
                      value.groupBy === id
                        ? "bg-accent text-accent-foreground"
                        : "bg-warm-100 text-warm-600 hover:bg-warm-200",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-warm-500">
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
                        parentCategoryId: undefined,
                        categoryId: undefined,
                      })
                    }
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition",
                      value.categoryKind === k
                        ? "bg-accent text-accent-foreground"
                        : "bg-warm-100 text-warm-600 hover:bg-warm-200",
                    )}
                  >
                    {t(l)}
                  </button>
                ))}
              </div>
              <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-warm-500">
                Danh mục cha
              </p>
              <ParentCategorySelector
                value={value.parentCategoryId}
                onChange={(id) =>
                  onChange({
                    ...value,
                    parentCategoryId: id,
                    categoryId: undefined,
                  })
                }
                kind={value.categoryKind}
                placeholder="Tất cả danh mục cha"
              />
              <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-warm-500">
                Danh mục con
              </p>
              <CategorySelector
                value={value.categoryId}
                onChange={(id) =>
                  onChange({ ...value, categoryId: id })
                }
                kind={value.categoryKind}
                placeholder={t("categoryPlaceholder")}
              />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setMoreOpen(false)}
                >
                  {t("done")}
                </Button>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

      </div>

      {active > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-warm-500">
            <MoreHorizontal className="size-3" aria-hidden />
            {t("activeFilters")}
          </span>
          {hasDate ? (
            <ActiveChip
              label={dateLabel}
              onRemove={() =>
                onChange({
                  ...value,
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
              onRemove={() => toggleType(ty)}
            />
          ))}
          {value.status && value.status !== DEFAULT_TXN_STATUS ? (
            <ActiveChip
              label={txnStatusLabel(value.status)}
              onRemove={() => onChange({ ...value, status: DEFAULT_TXN_STATUS })}
            />
          ) : null}
          {value.groupBy !== "none" ? (
            <ActiveChip
              label="Nhóm theo ngày"
              onRemove={() => onChange({ ...value, groupBy: "none" })}
            />
          ) : null}
          {value.sortBy !== "dateDesc" ? (
            <ActiveChip
              label={
                SORT_OPTIONS.find((o) => o.value === value.sortBy)?.label ??
                "Sắp xếp"
              }
              onRemove={() => onChange({ ...value, sortBy: "dateDesc" })}
            />
          ) : null}
          {value.parentCategoryId ? (
            <ActiveChip
              label={parentCategoryLabel ?? "Danh mục cha"}
              onRemove={() =>
                onChange({ ...value, parentCategoryId: undefined })
              }
            />
          ) : null}
          {value.categoryId ? (
            <ActiveChip
              label={t("categoryChip")}
              onRemove={() =>
                onChange({ ...value, categoryId: undefined })
              }
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
    </section>
  );
}
