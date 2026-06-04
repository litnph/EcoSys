import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm, type Resolver } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";

import type { FinSource } from "@/features/sources/types";
import { useSources } from "@/features/sources/hooks";
import { debtKeys } from "@/features/debt/api/debtKeys";
import { invalidateDashboard } from "@/features/dashboard/lib/invalidateDashboard";
import { sourceKeys } from "@/features/sources/api/sourceKeys";
import { Button } from "@/shared/components/ui/Button";
import { getFinanceApiErrorMessage } from "@/features/sources/utils/apiError";
import { formatNumber } from "@/shared/lib/formatters";
import {
  firstHookFormErrorMessage,
  scrollFirstHookFormErrorIntoView,
} from "@/shared/lib/scrollFirstFormError";
import { cn } from "@/shared/lib/utils";
import { useToastStore } from "@/shared/stores/toastStore";

import { createTransaction } from "../../api/transactionsApi";
import { transactionKeys } from "../../api/transactionKeys";
import { syncTransactionTags } from "../../utils/syncTransactionTags";
import { BaseFields } from "./BaseFields";
import { ConditionalFields } from "./ConditionalFields";
import { mapFormValuesToCreateBody } from "./mapFormToApi";
import { TypeSelector } from "./TypeSelector";
import {
  BULK_TRANSACTION_TYPES,
  buildTransactionSchema,
  defaultsForTxnForm,
  type TransactionCreateFormType,
  type TransactionFormValues,
} from "./transactionFormSchema";

export interface BulkTransactionRow {
  id: string;
  txnDate: string;
  amount: number;
}

function newRowId(): string {
  return `row-${String(Date.now())}-${Math.random().toString(36).slice(2, 7)}`;
}

function defaultBulkRow(txnDate?: string): BulkTransactionRow {
  return {
    id: newRowId(),
    txnDate: txnDate ?? format(new Date(), "yyyy-MM-dd"),
    amount: 0,
  };
}

function validateBulkRows(rows: BulkTransactionRow[]): string | null {
  if (rows.length === 0) return "Thêm ít nhất một dòng giao dịch.";
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.txnDate)) {
      return `Dòng ${String(i + 1)}: ngày không hợp lệ.`;
    }
    if (!(row.amount > 0)) {
      return `Dòng ${String(i + 1)}: số tiền phải lớn hơn 0.`;
    }
  }
  return null;
}

function formatAmountDisplay(amount: number, currency: string): string {
  if (amount === 0) return "";
  if (currency === "VND") return formatNumber(Math.round(amount));
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(
    amount);
}

function parseAmountInput(raw: string, currency: string): number {
  const trimmed = raw.trim();
  if (trimmed === "") return 0;
  if (currency === "VND") {
    const digits = trimmed.replace(/\D/g, "");
    return digits === "" ? 0 : parseInt(digits, 10);
  }
  const normalized = trimmed.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}

const compactInputClass = cn(
  "h-9 w-full rounded-md border border-warm-200 bg-warm-50 px-2 text-sm font-mono text-warm-900",
  "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60");

interface BulkRowAmountInputProps {
  value: number;
  currency: string;
  disabled?: boolean;
  inputRef: (el: HTMLInputElement | null) => void;
  onChange: (amount: number) => void;
  onEnter: () => void;
  onTabNext: () => void;
}

function BulkRowAmountInput({
  value,
  currency,
  disabled,
  inputRef,
  onChange,
  onEnter,
  onTabNext,
}: BulkRowAmountInputProps) {
  const localRef = useRef<HTMLInputElement | null>(null);
  const focusedRef = useRef(false);

  useEffect(() => {
    const el = localRef.current;
    if (!el || focusedRef.current) return;
    el.value = formatAmountDisplay(value, currency);
  }, [value, currency]);

  return (
    <input
      ref={(el) => {
        localRef.current = el;
        inputRef(el);
      }}
      type="text"
      inputMode={currency === "VND" ? "numeric" : "decimal"}
      autoComplete="off"
      disabled={disabled}
      defaultValue={formatAmountDisplay(value, currency)}
      className={cn(compactInputClass, "text-right tabular-nums")}
      onFocus={(e) => {
        focusedRef.current = true;
        const el = e.currentTarget;
        el.value =
          value === 0
            ? ""
            : currency === "VND"
              ? String(Math.round(value))
              : String(value);
      }}
      onBlur={(e) => {
        focusedRef.current = false;
        const parsed = parseAmountInput(e.currentTarget.value, currency);
        onChange(parsed);
        e.currentTarget.value = formatAmountDisplay(parsed, currency);
      }}
      onInput={(e) => {
        const el = e.currentTarget;
        if (currency === "VND") {
          const cleaned = el.value.replace(/\D/g, "");
          if (el.value !== cleaned) el.value = cleaned;
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const parsed = parseAmountInput(e.currentTarget.value, currency);
          onChange(parsed);
          e.currentTarget.value = formatAmountDisplay(parsed, currency);
          onEnter();
          return;
        }
        if (e.key === "Tab" && !e.shiftKey) {
          const parsed = parseAmountInput(e.currentTarget.value, currency);
          if (parsed > 0) {
            e.preventDefault();
            const scaled = parsed * 1000;
            onChange(scaled);
            e.currentTarget.value = formatAmountDisplay(scaled, currency);
            onTabNext();
          }
        }
      }}
    />
  );
}

export interface BulkTransactionFormProps {
  sources?: FinSource[];
  onSucceeded?: () => void;
}

export function BulkTransactionForm({
  sources: sourcesProp,
  onSucceeded,
}: BulkTransactionFormProps) {
  const [submitError, setSubmitError] = useState("");
  const [validationHint, setValidationHint] = useState("");
  const [rows, setRows] = useState<BulkTransactionRow[]>(() => [
    defaultBulkRow(),
    defaultBulkRow(),
  ]);
  const [busy, setBusy] = useState(false);
  const dateRefs = useRef(new Map<string, HTMLInputElement | null>());
  const amountRefs = useRef(new Map<string, HTMLInputElement | null>());
  const pendingFocusAmountId = useRef<string | null>(null);

  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const { data: fetchedSources } = useSources();

  const sources = useMemo(
    () => sourcesProp ?? fetchedSources ?? [],
    [sourcesProp, fetchedSources]);

  const dynamicResolver = useMemo(
    (): Resolver<TransactionFormValues> => (values, context, opts) =>
      (
        zodResolver as unknown as (
          schema: unknown) => Resolver<TransactionFormValues>
      )(buildTransactionSchema(values.type))(values, context, opts),
    []);

  const form = useForm<TransactionFormValues>({
    resolver: dynamicResolver,
    defaultValues: defaultsForTxnForm("direct", { amount: 1, txnDate: format(new Date(), "yyyy-MM-dd") }),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const { watch, handleSubmit, reset } = form;
  const typeValue = watch("type");
  const sourceId = watch("sourceId");

  const currency = useMemo(() => {
    const row = sources.find((s) => s.id === sourceId);
    return row?.currency ?? "VND";
  }, [sources, sourceId]);

  function handleChangeType(next: TransactionCreateFormType) {
    reset(
      defaultsForTxnForm(next, {
        amount: 1,
        txnDate: format(new Date(), "yyyy-MM-dd"),
      }));
    setSubmitError("");
    setValidationHint("");
  }

  function updateRow(id: string, patch: Partial<BulkTransactionRow>) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow(focusNew = false, txnDate?: string) {
    const row = defaultBulkRow(txnDate);
    if (focusNew) pendingFocusAmountId.current = row.id;
    setRows((prev) => [...prev, row]);
  }

  function removeRow(id: string) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
    dateRefs.current.delete(id);
    amountRefs.current.delete(id);
  }

  function focusAmount(rowId: string) {
    amountRefs.current.get(rowId)?.focus();
  }

  function focusNextRowAmount(currentIndex: number) {
    const next = rows[currentIndex + 1];
    if (next) {
      focusAmount(next.id);
      return;
    }
    addRow(true, rows[currentIndex]?.txnDate);
  }

  useEffect(() => {
    const id = pendingFocusAmountId.current;
    if (!id) return;
    pendingFocusAmountId.current = null;
    focusAmount(id);
  }, [rows]);

  return (
    <FormProvider {...form}>
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={handleSubmit(
          async (vals) => {
            setSubmitError("");
            setValidationHint("");
            const rowErr = validateBulkRows(rows);
            if (rowErr) {
              setValidationHint(rowErr);
              return;
            }

            setBusy(true);
            let created = 0;
            const tagIds = vals.tagIds ?? [];
            try {
              for (const row of rows) {
                const body = mapFormValuesToCreateBody(
                  { ...vals, amount: row.amount, txnDate: row.txnDate },
                  sources);
                const txn = await createTransaction(body);
                if (tagIds.length > 0) {
                  await syncTransactionTags(txn.id, [], tagIds);
                }
                created++;
              }
              await Promise.all([
                queryClient.invalidateQueries({ queryKey: transactionKeys.lists() }),
                queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
                queryClient.invalidateQueries({ queryKey: debtKeys.all }),
                queryClient.invalidateQueries({ queryKey: sourceKeys.lists() }),
              ]);
              invalidateDashboard(queryClient);
              addToast({
                type: "success",
                title: `Đã tạo ${String(created)} giao dịch`,
              });
              reset(defaultsForTxnForm(vals.type, { amount: 1, txnDate: format(new Date(), "yyyy-MM-dd") }));
              setRows([defaultBulkRow(), defaultBulkRow()]);
              onSucceeded?.();
            } catch (err) {
              const base = getFinanceApiErrorMessage(err);
              setSubmitError(
                created > 0
                  ? `${base} (${String(created)} giao dịch đã tạo trước khi lỗi.)`
                  : base);
            } finally {
              setBusy(false);
            }
          },
          (errs) => {
            scrollFirstHookFormErrorIntoView(errs, form);
            setValidationHint(
              firstHookFormErrorMessage(errs) ??
                "Vui lòng điền đủ các trường chung bắt buộc.",
            );
          })}
      >
        <TypeSelector
          value={typeValue}
          onChange={handleChangeType}
          disabled={busy}
          allowedTypes={BULK_TRANSACTION_TYPES}
        />

        <BaseFields
          sources={sources}
          disabled={busy}
          currency={currency}
          variant="sharedOnly"
        />

        <ConditionalFields
          sources={sources}
          disabled={busy}
          txnCurrency={currency}
        />

        <section className="rounded-card border border-warm-200 bg-warm-25/30 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs text-warm-500">
              Tab ở số tiền → ×1000, sang số tiền dòng sau · Enter cũng sang dòng sau
            </p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              leftIcon={<Plus className="size-3.5" aria-hidden />}
              disabled={busy}
              onClick={() => addRow(true)}
            >
              Thêm dòng
            </Button>
          </div>

          <div className="overflow-x-auto rounded-md border border-warm-100 bg-surface">
            <table className="w-full min-w-[320px] text-sm">
              <thead>
                <tr className="border-b border-warm-100 text-left text-[11px] font-medium uppercase tracking-wide text-warm-500">
                  <th className="w-8 px-2 py-1.5">#</th>
                  <th className="px-2 py-1.5">Ngày</th>
                  <th className="px-2 py-1.5 text-right">Số tiền</th>
                  <th className="w-9 px-1 py-1.5" aria-label="Xóa" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className="border-t border-warm-50 first:border-t-0"
                  >
                    <td className="px-2 py-1 text-xs tabular-nums text-warm-400">
                      {idx + 1}
                    </td>
                    <td className="px-2 py-1">
                      <input
                        ref={(el) => {
                          dateRefs.current.set(row.id, el);
                        }}
                        type="date"
                        tabIndex={-1}
                        value={row.txnDate}
                        disabled={busy}
                        onChange={(e) =>
                          updateRow(row.id, { txnDate: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            focusAmount(row.id);
                          }
                        }}
                        className={compactInputClass}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <BulkRowAmountInput
                        value={row.amount}
                        currency={currency}
                        disabled={busy}
                        inputRef={(el) => {
                          amountRefs.current.set(row.id, el);
                        }}
                        onChange={(n) => updateRow(row.id, { amount: n })}
                        onEnter={() => focusNextRowAmount(idx)}
                        onTabNext={() => focusNextRowAmount(idx)}
                      />
                    </td>
                    <td className="px-1 py-1 text-center">
                      <button
                        type="button"
                        tabIndex={-1}
                        className="rounded p-1 text-warm-400 hover:bg-warm-100 hover:text-danger disabled:opacity-40"
                        aria-label={`Xóa dòng ${String(idx + 1)}`}
                        disabled={busy || rows.length <= 1}
                        onClick={() => removeRow(row.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {validationHint.length > 0 ? (
          <div
            className="rounded-md border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger"
            role="alert"
          >
            {validationHint}
          </div>
        ) : null}

        {submitError.length > 0 ? (
          <div
            className="rounded-md border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger"
            role="alert"
          >
            {submitError}
          </div>
        ) : null}

        <div className="sticky bottom-0 z-[1] -mx-1 border-t border-warm-100 bg-surface pb-2 pt-4 md:static md:border-t-0 md:bg-transparent md:pb-0 md:pt-0">
          <Button
            type="submit"
            className="w-full"
            disabled={busy}
            isLoading={busy}
          >
            Tạo {rows.length} giao dịch
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
