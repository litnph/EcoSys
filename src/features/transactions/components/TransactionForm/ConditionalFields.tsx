import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import {
  Controller,
  useFieldArray,
  useFormContext,
  useWatch,
} from "react-hook-form";

import { CategorySelector } from "@/features/categories/components/CategorySelector";
import type { FinSource } from "@/features/sources/types";
import { Button } from "@/shared/components/ui/Button";
import { CurrencyInput } from "@/shared/components/ui/CurrencyInput";
import { Input } from "@/shared/components/ui/Input";
import { formatCurrency } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";

import { useDebtRecords } from "../../hooks/useDebtRecords";
import type {
  TransactionCreateFormType,
  TransactionFormValues,
} from "./transactionFormSchema";
import { isCreditCardExpenseSource } from "./resolveExpenseApiType";
import { categoryKindFor } from "./transactionFormSchema";

export interface ConditionalFieldsProps {
  sources?: FinSource[];
  disabled?: boolean;
  txnCurrency: string;
  className?: string;
}

export function ConditionalFields({
  sources,
  disabled,
  txnCurrency,
  className,
}: ConditionalFieldsProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext<TransactionFormValues>();

  const txnType =
    useWatch({ control, name: "type" }) as TransactionCreateFormType;

  const sourceId = useWatch({ control, name: "sourceId" });
  const mainAmount = useWatch({ control, name: "amount" }) ?? 0;
  const splitsWatch = useWatch({ control, name: "splits" });

  const expenseViaCard =
    txnType === "direct" &&
    typeof sourceId === "string" &&
    sourceId.length > 0 &&
    isCreditCardExpenseSource(sourceId, sources ?? []);

  const destCandidates = useMemo(
    () =>
      (sources ?? []).filter(
        (s) => typeof sourceId !== "string" || !sourceId || s.id !== sourceId),
    [sources, sourceId]);

  const splitSum = useMemo(
    () =>
      (splitsWatch ?? []).reduce(
        (acc, row) =>
          acc + (typeof row?.amount === "number" ? row.amount : 0),
        0),
    [splitsWatch]);

  const splitMismatch =
    Math.abs(splitSum - mainAmount) > 0.005 && (splitsWatch?.length ?? 0) > 0;

  const categoryErr = errors.categoryId?.message as string | undefined;
  const toSourceErr = errors.toSourceId?.message as string | undefined;
  const splitsErr = errors.splits?.message as unknown;
  const splitsErrMsg =
    typeof splitsErr === "string" ? splitsErr : undefined;
  const personNameErr = errors.personName?.message as string | undefined;
  const dueErr = errors.dueDate?.message as string | undefined;
  const debtErr = errors.debtRecordId?.message as string | undefined;

  if (!txnType) return null;

  return (
    <div className={cn("mt-6 flex flex-col gap-6", className)}>
      {(txnType === "direct" ||
        txnType === "income" ||
        txnType === "split") && (
        <Controller
          name="categoryId"
          control={control}
          render={({ field }) => (
            <div>
              <span className="mb-2 block text-sm font-medium text-warm-700">
                Danh mục
              </span>
              <input
                type="hidden"
                name="categoryId"
                value={field.value ?? ""}
                readOnly
                tabIndex={-1}
                aria-hidden
              />
              <CategorySelector
                key={`${txnType}-${categoryKindFor(txnType)}`}
                value={field.value}
                onChange={(id) => {
                  field.onChange(id);
                }}
                kind={categoryKindFor(txnType)}
                disabled={disabled}
                error={categoryErr}
              />
              {expenseViaCard ? (
                <p className="mt-1.5 text-xs text-warm-600">
                  Nguồn là thẻ tín dụng — giao dịch sẽ ghi vào kỳ sao kê (quẹt thẻ).
                </p>
              ) : null}
            </div>
          )}
        />
      )}

      {txnType === "transfer" ? (
        <div>
          <span
            id="txn-destination-label"
            className="mb-1 block text-sm font-medium text-warm-700"
          >
            Nguồn nhận
          </span>
          <Controller
            name="toSourceId"
            control={control}
            render={({ field }) => (
              <SelectPrimitive.Root
                value={field.value?.length ? field.value : "__none__"}
                onValueChange={(v) =>
                  field.onChange(v === "__none__" ? "" : v)
                }
                disabled={disabled || !destCandidates.length}
              >
                <SelectPrimitive.Trigger
                  aria-labelledby="txn-destination-label"
                  aria-invalid={toSourceErr ? true : undefined}
                  aria-describedby={
                    toSourceErr ? "txn-destination-error" : undefined
                  }
                  className={cn(
                    "flex h-11 w-full items-center justify-between gap-2 rounded-button border bg-warm-50 px-3 text-left text-sm text-warm-900",
                    toSourceErr ? "border-danger" : "border-warm-200",
                    "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-60")}
                >
                  <span className="min-w-0 flex-1 truncate">
                    {!field.value?.length ? (
                      <span className="text-warm-400">Chọn nguồn đích</span>
                    ) : (
                      destCandidates.find((s) => s.id === field.value)
                        ?.name ?? field.value.slice(0, 8)
                    )}
                  </span>
                  <ChevronDown className="size-4 shrink-0 text-warm-500" />
                </SelectPrimitive.Trigger>
                <SelectPrimitive.Portal>
                  <SelectPrimitive.Content
                    sideOffset={4}
                    position="popper"
                    className={cn(
                      "z-[120] max-h-[260px] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-button border border-warm-200 bg-warm-50 shadow-lg")}
                  >
                    <SelectPrimitive.Viewport className="max-h-[240px] overflow-y-auto p-1">
                      <SelectPrimitive.Item
                        value="__none__"
                        className={cn(
                          "relative rounded-md px-3 py-2 text-sm outline-none data-[highlighted]:bg-warm-100")}
                      >
                        Chọn…
                      </SelectPrimitive.Item>
                      {destCandidates.map((s) => (
                        <SelectPrimitive.Item
                          key={s.id}
                          value={s.id}
                          className={cn(
                            "relative rounded-md px-3 py-2 text-sm outline-none data-[highlighted]:bg-warm-100")}
                        >
                          <SelectPrimitive.ItemText>
                            <span className="flex justify-between gap-2">
                              <span className="truncate">{s.name}</span>
                              <span className="shrink-0 font-mono text-xs text-warm-600">
                                {formatCurrency(s.balance, s.currency)}
                              </span>
                            </span>
                          </SelectPrimitive.ItemText>
                        </SelectPrimitive.Item>
                      ))}
                    </SelectPrimitive.Viewport>
                  </SelectPrimitive.Content>
                </SelectPrimitive.Portal>
              </SelectPrimitive.Root>
            )}
          />
          {toSourceErr ? (
            <p
              id="txn-destination-error"
              className="mt-1 text-sm text-danger"
              role="alert"
            >
              {toSourceErr}
            </p>
          ) : null}
        </div>
      ) : null}

      {txnType === "split" ? (
        <>
          <SplitParticipants currency={txnCurrency} disabled={disabled} />
          {splitsErrMsg ? (
            <p className="text-sm text-danger" role="alert">
              {splitsErrMsg}
            </p>
          ) : null}
          <p
            className={cn(
              "text-sm",
              splitMismatch ? "font-medium text-warm-800" : "text-warm-600")}
          >
            Tổng phần:{" "}
            <strong className="tabular-nums">
              {formatCurrency(splitSum, txnCurrency)}
            </strong>
            {" / "}
            Số tiền giao dịch:{" "}
            <strong className="tabular-nums">
              {formatCurrency(mainAmount, txnCurrency)}
            </strong>
          </p>
          {splitMismatch && !splitsErrMsg ? (
            <p className="text-sm text-accent-dark">
              Các phần chưa cộng trùng tổng giao dịch.
            </p>
          ) : null}
        </>
      ) : null}

      {txnType === "debt_borrow" || txnType === "loan_give" ? (
        <div className="flex flex-col gap-4">
          <p className="rounded-button border border-warm-200 bg-warm-50/80 px-3 py-2 text-xs text-warm-700">
            {txnType === "debt_borrow"
              ? "Dùng khi vừa nhận tiền vay — số dư ví tăng và có trong báo cáo. Nợ từ trước: trang Nợ →「Ghi nhận nợ hiện có」."
              : "Dùng khi vừa cho mượn tiền — số dư ví giảm. Khoản cho vay cũ: trang Nợ →「Ghi nhận nợ hiện có」."}
          </p>
          <Controller
            name="personName"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Tên đối tác"
                disabled={disabled}
                placeholder={
                  txnType === "loan_give" ? "Ai vay bạn?" : "Ai cho bạn mượn?"
                }
                error={personNameErr}
              />
            )}
          />
          <Controller
            name="personContact"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Liên hệ (tuỳ chọn)"
                disabled={disabled}
                placeholder="SĐT hoặc nơi nhắn"
              />
            )}
          />
          <div>
            <label
              htmlFor="due-date-field"
              className="mb-1 block text-sm font-medium text-warm-700"
            >
              Hạn{" "}
              <span className="font-normal text-warm-500">(tuỳ chọn)</span>
            </label>
            <Controller
              name="dueDate"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  id="due-date-field"
                  type="date"
                  disabled={disabled}
                  className={cn(
                    "h-11 w-full rounded-button border px-3 text-sm font-mono disabled:opacity-60",
                    dueErr ? "border-danger" : "border-warm-200 bg-warm-50",
                    "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30")}
                  aria-invalid={dueErr ? true : undefined}
                  aria-describedby={dueErr ? "due-date-error" : undefined}
                />
              )}
            />
            {dueErr ? (
              <p id="due-date-error" className="mt-1 text-sm text-danger" role="alert">
                {dueErr}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {txnType === "debt_repay" || txnType === "loan_collect" ? (
        <DebtRecordBlock
          
          txnType={txnType}
          disabled={disabled}
          debtErr={debtErr}
        />
      ) : null}
    </div>
  );
}

function DebtRecordBlock({
  txnType,
  disabled,
  debtErr,
}: {
  txnType: "debt_repay" | "loan_collect";
  disabled?: boolean;
  debtErr?: string;
}) {
  const direction = txnType === "debt_repay" ? "borrowed" : "lent";

  const { control } = useFormContext<TransactionFormValues>();
  const { data = [], isLoading } = useDebtRecords( direction);

  const label =
    txnType === "debt_repay"
      ? "Trả cho khoản vay của bạn"
      : "Thu từ khoản đã cho vay";

  return (
    <div>
      <span
        id="debt-record-label"
        className="mb-1 block text-sm font-medium text-warm-700"
      >
        {label}
      </span>
      <Controller
        name="debtRecordId"
        control={control}
        render={({ field }) => (
          <SelectPrimitive.Root
            value={field.value?.length ? field.value : "__none__"}
            onValueChange={(v) =>
              field.onChange(v === "__none__" ? "" : v)
            }
            disabled={
              disabled || false || isLoading
            }
          >
            <SelectPrimitive.Trigger
              aria-labelledby="debt-record-label"
              aria-invalid={debtErr ? true : undefined}
              aria-describedby={debtErr ? "debt-record-error" : undefined}
              className={cn(
                "flex h-11 w-full items-center justify-between rounded-button border bg-warm-50 px-3 text-left text-sm text-warm-900",
                debtErr ? "border-danger" : "border-warm-200",
                "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60")}
            >
              <span className="min-w-0 flex-1 truncate">
                {isLoading ? (
                  "Đang tải…"
                ) : field.value?.length &&
                  data.some((x) => x.id === field.value) ? (
                  (() => {
                    const row = data.find((x) => x.id === field.value)!;
                    const person = row.personName?.trim() || "Đối tác";
                    const cur = row.currency ?? "VND";
                    const rem = formatCurrency(row.remainingAmount, cur);
                    return `${person} — còn ${rem}`;
                  })()
                ) : (
                  <span className="text-warm-400">Chọn khoản</span>
                )}
              </span>
              <ChevronDown className="size-4 shrink-0 text-warm-500" />
            </SelectPrimitive.Trigger>
            <SelectPrimitive.Portal>
              <SelectPrimitive.Content
                sideOffset={4}
                position="popper"
                className={cn(
                  "z-[120] max-h-[260px] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-button border border-warm-200 bg-warm-50 shadow-lg")}
              >
                <SelectPrimitive.Viewport className="max-h-[240px] overflow-y-auto p-1">
                  <SelectPrimitive.Item
                    value="__none__"
                    className="relative px-3 py-2 text-sm outline-none data-[highlighted]:bg-warm-100"
                  >
                    Chọn…
                  </SelectPrimitive.Item>
                  {data.map((row) => {
                    const cur = row.currency ?? "VND";
                    const person = row.personName?.trim() || "Đối tác";
                    const rem = formatCurrency(row.remainingAmount, cur);
                    return (
                      <SelectPrimitive.Item key={row.id} value={row.id}>
                        <SelectPrimitive.ItemText>
                          <span>{`${person} — còn ${rem}`}</span>
                        </SelectPrimitive.ItemText>
                      </SelectPrimitive.Item>
                    );
                  })}
                  {!data.length && !isLoading ? (
                    <div className="px-3 py-2 text-sm text-warm-500">
                      Không có khoản đang hoạt động
                    </div>
                  ) : null}
                </SelectPrimitive.Viewport>
              </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
          </SelectPrimitive.Root>
        )}
      />
      {debtErr ? (
        <p id="debt-record-error" className="mt-1 text-sm text-danger" role="alert">
          {debtErr}
        </p>
      ) : null}
    </div>
  );
}

function SplitParticipants({
  currency,
  disabled,
}: {
  currency: string;
  disabled?: boolean;
}) {
  const { control, formState } = useFormContext<TransactionFormValues>();
  const splitFieldErrors = formState.errors.splits;

  const { fields: rows, append, remove } = useFieldArray({
    control,
    name: "splits",
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-warm-700">
          Người chia tiền
        </span>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={disabled}
          leftIcon={<Plus className="size-4" aria-hidden />}
          onClick={() => append({ personName: "", amount: 0 })}
        >
          Thêm người
        </Button>
      </div>
      <ul className="flex flex-col gap-3">
        {rows.map((row, idx) => {
          const nameErr =
            typeof splitFieldErrors?.[idx]?.personName?.message === "string"
              ? splitFieldErrors[idx]!.personName!.message!
              : undefined;
          const amtErr =
            typeof splitFieldErrors?.[idx]?.amount?.message === "string"
              ? splitFieldErrors[idx]!.amount!.message!
              : undefined;
          return (
            <li key={row.id} className="rounded-card border border-warm-200 p-3">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <Controller
                    control={control}
                    name={`splits.${idx}.personName`}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label={`Người ${idx + 1}`}
                        disabled={disabled}
                        placeholder="Tên"
                        error={nameErr}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name={`splits.${idx}.amount`}
                    render={({ field }) => (
                      <CurrencyInput
                        currency={currency}
                        value={typeof field.value === "number" ? field.value : 0}
                        onChange={field.onChange}
                        label="Số tiền"
                        disabled={disabled}
                        error={amtErr}
                        required
                      />
                    )}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  aria-label={`Xóa người ${idx + 1}`}
                  disabled={disabled || rows.length <= 1}
                  onClick={() => remove(idx)}
                >
                  <Trash2 className="size-4 text-warm-500" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
