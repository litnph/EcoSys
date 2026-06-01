import {
  ArrowUpDown,
  CalendarRange,
  Check,
  LayoutList,
  ListFilter,
  Tags,
  Wallet,
} from "lucide-react";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import type { Locale } from "date-fns/locale";
import * as React from "react";

import { CategorySelector } from "@/features/categories/components/CategorySelector";
import { ParentCategorySelector } from "@/features/categories/components/ParentCategorySelector";
import { Button } from "@/shared/components/ui/Button";
import { CurrencyInput } from "@/shared/components/ui/CurrencyInput";
import { Modal } from "@/shared/components/ui/Modal";
import { cn } from "@/shared/lib/utils";

import type {
  TransactionFilterState,
  TransactionSortBy,
  TransactionType,
} from "../types";
import { TRANSACTION_TYPES } from "../types";
import {
  transactionTypeIcon,
  transactionTypeLabel,
} from "../utils/txnDisplay";
import { currentBillingPeriodKey } from "../utils/periodFilter";

import { TransactionDateRangePicker } from "./TransactionDateRangePicker";

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

const TXN_TYPES = TRANSACTION_TYPES.filter((ty) => ty !== "reversal");

function countDraftMoreFilters(draft: TransactionFilterState): number {
  let n = 0;
  if (draft.types.length > 0) n += 1;
  if (draft.parentCategoryId) n += 1;
  if (draft.categoryId) n += 1;
  if (typeof draft.amountMin === "number" && draft.amountMin > 0) n += 1;
  if (typeof draft.amountMax === "number" && draft.amountMax > 0) n += 1;
  if (draft.groupBy !== "none") n += 1;
  if (draft.sortBy !== "dateDesc") n += 1;
  if (draft.dateFrom || draft.dateTo) n += 1;
  return n;
}

function FilterSection({
  icon: Icon,
  title,
  description,
  action,
  children,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-warm-200 bg-warm-25/50 p-3",
        className,
      )}
    >
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex min-w-0 items-center gap-2 font-display text-sm font-semibold text-warm-900">
          {Icon ? (
            <Icon className="size-4 shrink-0 text-accent" aria-hidden />
          ) : null}
          <span className="truncate">{title}</span>
        </h3>
        {action}
      </div>
      {description ? (
        <p className="mb-2.5 text-xs text-warm-500">{description}</p>
      ) : null}
      {children}
    </section>
  );
}

function PillGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-warm-200 bg-warm-50/80 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition",
            value === opt.value
              ? "bg-accent text-accent-foreground shadow-sm"
              : "text-warm-600 hover:bg-warm-100 hover:text-warm-800",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export interface TransactionMoreFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: TransactionFilterState;
  onChange: (next: TransactionFilterState) => void;
  dateLocale: Locale;
  tFilters: (key: string) => string;
  tTx: (key: string) => string;
}

export function TransactionMoreFiltersModal({
  isOpen,
  onClose,
  value,
  onChange,
  dateLocale,
  tFilters,
  tTx,
}: TransactionMoreFiltersModalProps) {
  const [draft, setDraft] = React.useState(value);

  React.useEffect(() => {
    if (isOpen) setDraft(value);
  }, [isOpen, value]);

  const range: DateRange | undefined =
    draft.dateFrom || draft.dateTo
      ? {
          from: draft.dateFrom
            ? new Date(`${draft.dateFrom}T00:00:00`)
            : undefined,
          to: draft.dateTo
            ? new Date(`${draft.dateTo}T00:00:00`)
            : undefined,
        }
      : undefined;

  const draftActiveCount = countDraftMoreFilters(draft);

  const toggleType = (ty: TransactionType) => {
    setDraft((prev) => {
      const set = new Set(prev.types);
      if (set.has(ty)) set.delete(ty);
      else set.add(ty);
      return { ...prev, types: Array.from(set) as TransactionType[] };
    });
  };

  const apply = () => {
    const hasCustomRange = Boolean(draft.dateFrom || draft.dateTo);
    onChange({
      ...draft,
      billingPeriod: hasCustomRange
        ? "custom"
        : value.billingPeriod === "custom"
          ? currentBillingPeriodKey()
          : value.billingPeriod,
    });
    onClose();
  };

  const resetAll = () => {
    setDraft((prev) => ({
      ...prev,
      types: [],
      parentCategoryId: undefined,
      categoryId: undefined,
      amountMin: undefined,
      amountMax: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      groupBy: "none",
      sortBy: "dateDesc",
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bộ lọc nâng cao"
      description="Tinh chỉnh loại giao dịch, danh mục, số tiền và khoảng ngày."
      size="lg"
    >
      <div className="space-y-3">
          <FilterSection
            icon={ListFilter}
            title="Loại giao dịch"
            description="Để trống = tất cả loại."
            action={
              draft.types.length > 0 ? (
                <button
                  type="button"
                  className="shrink-0 text-xs font-medium text-accent hover:text-accent-dark"
                  onClick={() => setDraft((p) => ({ ...p, types: [] }))}
                >
                  Bỏ chọn
                </button>
              ) : null
            }
          >
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {TXN_TYPES.map((ty) => {
                const Icon = transactionTypeIcon(ty);
                const checked = draft.types.includes(ty);
                return (
                  <li key={ty}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-sm transition",
                        checked
                          ? "border-accent/35 bg-accent/10 text-accent-emphasis shadow-sm"
                          : "border-warm-200 bg-surface hover:border-warm-300 hover:bg-warm-50",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="size-4 rounded border-warm-300 accent-accent"
                        checked={checked}
                        onChange={() => toggleType(ty)}
                      />
                      <Icon
                        className="size-4 shrink-0 opacity-80"
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 leading-tight">
                        {transactionTypeLabel(ty, tTx)}
                      </span>
                      {checked ? (
                        <Check className="size-4 shrink-0" aria-hidden />
                      ) : null}
                    </label>
                  </li>
                );
              })}
            </ul>
          </FilterSection>

          <div className="grid gap-3 sm:grid-cols-2">
            <FilterSection icon={ArrowUpDown} title="Sắp xếp">
              <select
                value={draft.sortBy}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    sortBy: e.target.value as TransactionSortBy,
                  })
                }
                className="h-10 w-full rounded-lg border border-warm-200 bg-surface px-3 text-sm text-warm-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FilterSection>

            <FilterSection icon={LayoutList} title="Hiển thị">
              <PillGroup
                value={draft.groupBy}
                options={[
                  { id: "none", label: "Danh sách phẳng" },
                  { id: "day", label: "Nhóm theo ngày" },
                ].map(({ id, label }) => ({ value: id, label }))}
                onChange={(id) =>
                  setDraft({ ...draft, groupBy: id })
                }
              />
            </FilterSection>
          </div>

          <FilterSection
            icon={Tags}
            title={tFilters("categoryLabel")}
          >
            <div className="mb-3">
              <PillGroup
                value={draft.categoryKind}
                options={[
                  { value: "expense", label: tFilters("categoryKindExpense") },
                  { value: "income", label: tFilters("categoryKindIncome") },
                  {
                    value: "transfer",
                    label: tFilters("categoryKindTransfer"),
                  },
                ]}
                onChange={(k) =>
                  setDraft({
                    ...draft,
                    categoryKind: k,
                    parentCategoryId: undefined,
                    categoryId: undefined,
                  })
                }
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-warm-600">
                  Danh mục cha
                </label>
                <ParentCategorySelector
                  value={draft.parentCategoryId}
                  onChange={(id) =>
                    setDraft({
                      ...draft,
                      parentCategoryId: id,
                      categoryId: undefined,
                    })
                  }
                  kind={draft.categoryKind}
                  placeholder="Danh mục cha"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-warm-600">
                  Danh mục con
                </label>
                <CategorySelector
                  value={draft.categoryId}
                  onChange={(id) => setDraft({ ...draft, categoryId: id })}
                  kind={draft.categoryKind}
                  placeholder={tFilters("categoryPlaceholder")}
                />
              </div>
            </div>
          </FilterSection>

          <FilterSection
            icon={Wallet}
            title="Khoảng số tiền"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <CurrencyInput
                label={tFilters("amountMin")}
                value={draft.amountMin ?? 0}
                onChange={(n) =>
                  setDraft({
                    ...draft,
                    amountMin: n > 0 ? n : undefined,
                  })
                }
              />
              <CurrencyInput
                label={tFilters("amountMax")}
                value={draft.amountMax ?? 0}
                onChange={(n) =>
                  setDraft({
                    ...draft,
                    amountMax: n > 0 ? n : undefined,
                  })
                }
              />
            </div>
          </FilterSection>

          <FilterSection
            icon={CalendarRange}
            title="Khoảng ngày tùy chỉnh"
            description="Ghi đè kỳ trên thanh lọc chính."
            action={
              draft.dateFrom || draft.dateTo ? (
                <button
                  type="button"
                  className="shrink-0 text-xs font-medium text-accent hover:text-accent-dark"
                  onClick={() =>
                    setDraft((p) => ({
                      ...p,
                      dateFrom: undefined,
                      dateTo: undefined,
                    }))
                  }
                >
                  {tFilters("clearDates")}
                </button>
              ) : null
            }
          >
            {draft.dateFrom && draft.dateTo ? (
              <p className="mb-2 text-xs font-medium tabular-nums text-warm-700">
                {format(new Date(`${draft.dateFrom}T00:00:00`), "dd/MM/yyyy", {
                  locale: dateLocale,
                })}
                {" – "}
                {format(new Date(`${draft.dateTo}T00:00:00`), "dd/MM/yyyy", {
                  locale: dateLocale,
                })}
              </p>
            ) : null}
            <TransactionDateRangePicker
              range={range}
              dateLocale={dateLocale}
              onApplyRange={(partial) => setDraft({ ...draft, ...partial })}
              onClear={() => undefined}
              onDone={() => undefined}
              labels={{
                clearDates: tFilters("clearDates"),
                done: tFilters("done"),
              }}
            />
          </FilterSection>
      </div>

      <div className="sticky bottom-0 z-10 -mx-6 mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-warm-200 bg-surface px-6 py-3">
        <Button type="button" variant="ghost" size="sm" onClick={resetAll}>
          {tFilters("reset")}
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button type="button" size="sm" onClick={apply}>
            Áp dụng
            {draftActiveCount > 0 ? ` (${String(draftActiveCount)})` : ""}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
