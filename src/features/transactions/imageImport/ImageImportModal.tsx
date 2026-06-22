import { format } from "date-fns";
import { ImagePlus, Loader2, Plus, ScanLine, Trash2 } from "lucide-react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { CategorySelector } from "@/features/categories/components/CategorySelector";
import { invalidateDashboard } from "@/features/dashboard/lib/invalidateDashboard";
import { debtKeys } from "@/features/debt/api/debtKeys";
import { sourceKeys } from "@/features/sources/api/sourceKeys";
import { useSources } from "@/features/sources/hooks";
import type { FinSource } from "@/features/sources/types";
import { getFinanceApiErrorMessage } from "@/features/sources/utils/apiError";
import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";
import { formatNumber } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";
import { useToastStore } from "@/shared/stores/toastStore";

import { createTransaction } from "../api/transactionsApi";
import { transactionKeys } from "../api/transactionKeys";
import { resolveExpenseApiType } from "../components/TransactionForm/resolveExpenseApiType";
import { parseOcrTransactionText } from "./parseOcrTransactionText";
import { runImageOcr } from "./runImageOcr";
import type { ImageImportDraft } from "./types";
import { newDraftId } from "./types";

export interface ImageImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = "upload" | "review";

function formatAmountDisplay(amount: number, currency: string): string {
  if (amount === 0) return "";
  if (currency === "VND") return formatNumber(Math.round(amount));
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(
    amount,
  );
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

function SourcePicker({
  sources,
  value,
  onChange,
  disabled,
}: {
  sources: FinSource[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-warm-700">
        Nguồn tiền
      </label>
      <SelectPrimitive.Root
        value={value || "__none__"}
        onValueChange={(v) => onChange(v === "__none__" ? "" : v)}
        disabled={disabled || sources.length === 0}
      >
        <SelectPrimitive.Trigger
          className={cn(
            "flex h-11 w-full items-center justify-between gap-2 rounded-button border border-warm-200",
            "bg-warm-50 px-3 text-left text-sm text-warm-900",
            "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          <SelectPrimitive.Value placeholder="Chọn nguồn tiền" />
          <SelectPrimitive.Icon>
            <span className="text-warm-400">▾</span>
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            className="z-[200] max-h-60 overflow-auto rounded-button border border-warm-200 bg-surface p-1 shadow-lg"
          >
            <SelectPrimitive.Viewport>
              {sources.map((s) => (
                <SelectPrimitive.Item
                  key={s.id}
                  value={s.id}
                  className="cursor-pointer rounded-md px-3 py-2 text-sm outline-none data-[highlighted]:bg-warm-100"
                >
                  <SelectPrimitive.ItemText>{s.name}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  );
}

function resetModalState(): {
  step: Step;
  sourceId: string;
  previewUrl: string | null;
  drafts: ImageImportDraft[];
  categoryId: string;
  ocrProgress: number;
  scanError: string;
  submitError: string;
} {
  return {
    step: "upload",
    sourceId: "",
    previewUrl: null,
    drafts: [],
    categoryId: "",
    ocrProgress: 0,
    scanError: "",
    submitError: "",
  };
}

export function ImageImportModal({ isOpen, onClose }: ImageImportModalProps) {
  const { data: sources = [] } = useSources();
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  const [step, setStep] = useState<Step>("upload");
  const [sourceId, setSourceId] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [drafts, setDrafts] = useState<ImageImportDraft[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [scanError, setScanError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const currency =
    sources.find((s) => s.id === sourceId)?.currency ?? "VND";

  const revokePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      revokePreview();
      const initial = resetModalState();
      setStep(initial.step);
      setSourceId(initial.sourceId);
      setPreviewUrl(initial.previewUrl);
      setImageFile(null);
      setDrafts(initial.drafts);
      setCategoryId(initial.categoryId);
      setScanning(false);
      setOcrProgress(initial.ocrProgress);
      setScanError(initial.scanError);
      setSubmitting(false);
      setSubmitError(initial.submitError);
    }
  }, [isOpen, revokePreview]);

  useEffect(() => () => revokePreview(), [revokePreview]);

  function handlePickFile(file: File | null) {
    revokePreview();
    setImageFile(file);
    setScanError("");
    if (file) {
      const url = URL.createObjectURL(file);
      previewUrlRef.current = url;
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }

  async function handleScan() {
    if (!sourceId) {
      setScanError("Chọn nguồn tiền trước khi quét ảnh.");
      return;
    }
    if (!imageFile) {
      setScanError("Chọn hoặc tải ảnh lên.");
      return;
    }

    setScanning(true);
    setScanError("");
    setOcrProgress(0);

    try {
      const text = await runImageOcr(imageFile, setOcrProgress);
      const parsed = parseOcrTransactionText(text);
      if (parsed.length === 0) {
        setScanError(
          "Không nhận diện được giao dịch. Thử ảnh rõ hơn hoặc chỉnh sửa thủ công ở bước sau.",
        );
        setDrafts([
          {
            id: newDraftId(),
            txnDate: format(new Date(), "yyyy-MM-dd"),
            description: "",
            amount: 0,
            note: "",
            isRefund: false,
            categoryId: "",
            selected: true,
          },
        ]);
        setStep("review");
        return;
      }
      setDrafts(parsed);
      setStep("review");
    } catch (e) {
      setScanError(
        e instanceof Error ? e.message : "Không quét được ảnh. Thử lại.",
      );
    } finally {
      setScanning(false);
      setOcrProgress(0);
    }
  }

  function updateDraft(id: string, patch: Partial<ImageImportDraft>) {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    );
  }

  function removeDraft(id: string) {
    setDrafts((prev) =>
      prev.length <= 1 ? prev : prev.filter((d) => d.id !== id),
    );
  }

  function addDraftRow() {
    const last = drafts[drafts.length - 1];
    setDrafts((prev) => [
      ...prev,
      {
        id: newDraftId(),
        txnDate: last?.txnDate ?? format(new Date(), "yyyy-MM-dd"),
        description: "",
        amount: 0,
        note: "",
        isRefund: false,
        categoryId: last?.categoryId ?? "",
        selected: true,
      },
    ]);
  }

  function applyCategoryToSelectedExpenses() {
    if (!categoryId.trim()) return;
    setDrafts((prev) =>
      prev.map((d) =>
        d.selected && !d.isRefund ? { ...d, categoryId } : d,
      ),
    );
  }

  async function handleConfirm() {
    if (!sourceId) {
      setSubmitError("Chọn nguồn tiền.");
      return;
    }

    const selected = drafts.filter((d) => d.selected && !d.isRefund);
    const skippedRefunds = drafts.filter((d) => d.selected && d.isRefund);

    if (selected.length === 0) {
      setSubmitError(
        skippedRefunds.length > 0
          ? "Giao dịch hoàn trả (+) không được nhập riêng. Bỏ chọn hoàn trả hoặc chọn giao dịch chi tiêu cần lưu."
          : "Chọn ít nhất một giao dịch chi tiêu.",
      );
      return;
    }

    for (let i = 0; i < selected.length; i++) {
      const row = selected[i];
      if (!/^\d{4}-\d{2}-\d{2}$/.test(row.txnDate)) {
        setSubmitError(`Dòng ${String(i + 1)}: ngày không hợp lệ.`);
        return;
      }
      if (!(row.amount > 0)) {
        setSubmitError(`Dòng ${String(i + 1)}: số tiền phải lớn hơn 0.`);
        return;
      }
      if (!row.description.trim()) {
        setSubmitError(`Dòng ${String(i + 1)}: nhập mô tả.`);
        return;
      }
    }

    setSubmitting(true);
    setSubmitError("");
    let created = 0;

    try {
      const txnType = resolveExpenseApiType(sourceId, sources);
      for (const row of selected) {
        await createTransaction({
          type: txnType,
          amount: row.amount,
          sourceId,
          categoryId: row.categoryId.trim() || categoryId.trim() || null,
          txnDate: row.txnDate,
          description: row.description.trim(),
          note: row.note.trim() || null,
        });
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
        title: `Đã nhập ${String(created)} giao dịch từ ảnh`,
      });
      onClose();
    } catch (err) {
      const base = getFinanceApiErrorMessage(err);
      setSubmitError(
        created > 0
          ? `${base} (${String(created)} giao dịch đã tạo trước khi lỗi.)`
          : base,
      );
    } finally {
      setSubmitting(false);
    }
  }

  const selectedCount = drafts.filter((d) => d.selected && !d.isRefund).length;
  const expenseCount = drafts.filter((d) => !d.isRefund).length;
  const refundCount = drafts.length - expenseCount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nhập bằng ảnh"
      description={
        step === "upload"
          ? "Chọn nguồn tiền và tải ảnh sao kê / lịch sử giao dịch."
          : "Kiểm tra và chỉnh sửa danh sách giao dịch trước khi lưu."
      }
      size="full"
    >
      {step === "upload" ? (
        <div className="flex flex-col gap-5">
          <SourcePicker
            sources={sources}
            value={sourceId}
            onChange={setSourceId}
            disabled={scanning}
          />

          <div>
            <span className="mb-2 block text-sm font-medium text-warm-700">
              Ảnh giao dịch
            </span>
            <div
              className={cn(
                "flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed p-6",
                previewUrl
                  ? "border-warm-200 bg-warm-50/50"
                  : "border-warm-200 bg-warm-25/80",
              )}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Xem trước ảnh"
                  className="max-h-[320px] w-full max-w-md rounded-lg object-contain shadow-sm"
                />
              ) : (
                <>
                  <ImagePlus className="size-10 text-warm-300" aria-hidden />
                  <p className="text-center text-sm text-warm-500">
                    PNG, JPG hoặc ảnh chụp màn hình
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  handlePickFile(file);
                  e.target.value = "";
                }}
              />
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={scanning}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? "Đổi ảnh" : "Chọn ảnh"}
                </Button>
                {previewUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={scanning}
                    onClick={() => handlePickFile(null)}
                  >
                    Xóa ảnh
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          {scanning ? (
            <div
              className="rounded-lg border border-accent/25 bg-accent/5 px-4 py-3 text-sm text-warm-700"
              role="status"
            >
              <div className="flex items-center gap-2">
                <Loader2 className="size-4 shrink-0 animate-spin text-accent" />
                Đang nhận diện chữ… {Math.round(ocrProgress * 100)}%
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-warm-200">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${String(Math.round(ocrProgress * 100))}%` }}
                />
              </div>
            </div>
          ) : null}

          {scanError ? (
            <p className="text-sm text-danger" role="alert">
              {scanError}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-warm-100 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="button"
              leftIcon={<ScanLine className="size-4" aria-hidden />}
              isLoading={scanning}
              disabled={!imageFile || !sourceId}
              onClick={() => void handleScan()}
            >
              Quét ảnh
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-4 rounded-lg border border-warm-200 bg-warm-25/50 p-4">
            <div className="min-w-[200px] flex-1">
              <span className="mb-1 block text-xs font-medium text-warm-500">
                Nguồn tiền
              </span>
              <p className="text-sm font-medium text-warm-900">
                {sources.find((s) => s.id === sourceId)?.name ?? "—"}
              </p>
            </div>
            <div className="min-w-[240px] flex-1">
              <span className="mb-2 block text-sm font-medium text-warm-700">
                Gán danh mục hàng loạt
              </span>
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[200px] flex-1">
                  <CategorySelector
                    kind="expense"
                    value={categoryId || undefined}
                    onChange={(id) => setCategoryId(id ?? "")}
                    disabled={submitting}
                    placeholder="Chọn danh mục"
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={submitting || !categoryId.trim()}
                  onClick={applyCategoryToSelectedExpenses}
                >
                  Áp dụng cho dòng đã chọn
                </Button>
              </div>
            </div>
          </div>

          {refundCount > 0 ? (
            <p className="rounded-lg border border-success/25 bg-success/5 px-3 py-2 text-xs text-warm-600">
              {refundCount} giao dịch hoàn trả (+) — hủy thanh toán trước đó. Không
              nhập riêng; cặp cùng số tiền được bỏ chọn tự động.
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-warm-600">
              {selectedCount} / {expenseCount} chi tiêu được chọn
              {refundCount > 0 ? ` · ${String(refundCount)} hoàn trả` : ""}
            </p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              leftIcon={<Plus className="size-3.5" aria-hidden />}
              disabled={submitting}
              onClick={addDraftRow}
            >
              Thêm dòng
            </Button>
          </div>

          <div className="max-h-[min(50vh,420px)] overflow-auto rounded-lg border border-warm-200">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="sticky top-0 z-10 bg-warm-50 text-left text-[11px] font-medium uppercase tracking-wide text-warm-500">
                <tr className="border-b border-warm-200">
                  <th className="w-10 px-2 py-2">
                    <span className="sr-only">Chọn</span>
                  </th>
                  <th className="px-2 py-2">Ngày</th>
                  <th className="px-2 py-2">Mô tả</th>
                  <th className="px-2 py-2 text-right">Số tiền</th>
                  <th className="min-w-[11rem] px-2 py-2">Danh mục</th>
                  <th className="w-10 px-1 py-2" aria-label="Xóa" />
                </tr>
              </thead>
              <tbody>
                {drafts.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-t border-warm-100 first:border-t-0",
                      row.isRefund && "bg-success/5",
                    )}
                  >
                    <td className="px-2 py-1.5 align-top">
                      <input
                        type="checkbox"
                        checked={row.selected}
                        disabled={submitting}
                        title={
                          row.isRefund
                            ? "Hoàn trả — chỉ để tham khảo, không nhập vào sổ"
                            : undefined
                        }
                        className="size-4 rounded border-warm-300 text-accent"
                        onChange={(e) =>
                          updateDraft(row.id, { selected: e.target.checked })}
                      />
                    </td>
                    <td className="px-2 py-1.5 align-top">
                      <input
                        type="date"
                        value={row.txnDate}
                        disabled={submitting || !row.selected}
                        className="h-9 w-full min-w-[8.5rem] rounded-md border border-warm-200 bg-warm-50 px-2 text-sm"
                        onChange={(e) =>
                          updateDraft(row.id, { txnDate: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1.5 align-top">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {row.isRefund ? (
                          <span className="shrink-0 rounded bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
                            Hoàn trả
                          </span>
                        ) : null}
                        <input
                          type="text"
                          value={row.description}
                          disabled={submitting || !row.selected}
                          placeholder="Tên giao dịch"
                          className="h-9 min-w-0 flex-1 rounded-md border border-warm-200 bg-warm-50 px-2 text-sm"
                          onChange={(e) =>
                            updateDraft(row.id, { description: e.target.value })}
                        />
                      </div>
                      {row.note ? (
                        <p className="mt-1 line-clamp-2 text-[11px] text-warm-400">
                          {row.note}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-2 py-1.5 align-top">
                      <DraftAmountInput
                        value={row.amount}
                        currency={currency}
                        isRefund={row.isRefund}
                        disabled={submitting || !row.selected}
                        onChange={(amount) => updateDraft(row.id, { amount })}
                      />
                    </td>
                    <td className="px-2 py-1.5 align-top">
                      {row.isRefund ? (
                        <span className="block py-2 text-xs text-warm-400">—</span>
                      ) : (
                        <CategorySelector
                          kind="expense"
                          value={row.categoryId || undefined}
                          onChange={(id) =>
                            updateDraft(row.id, { categoryId: id ?? "" })}
                          disabled={submitting || !row.selected}
                          placeholder="Danh mục"
                          className="[&_button]:h-9 [&_button]:text-xs"
                        />
                      )}
                    </td>
                    <td className="px-1 py-1.5 align-top">
                      <button
                        type="button"
                        disabled={submitting || drafts.length <= 1}
                        className="rounded p-1 text-warm-400 hover:bg-warm-100 hover:text-danger disabled:opacity-40"
                        aria-label="Xóa dòng"
                        onClick={() => removeDraft(row.id)}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {submitError ? (
            <p className="text-sm text-danger" role="alert">
              {submitError}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-between gap-2 border-t border-warm-100 pt-4">
            <Button
              type="button"
              variant="ghost"
              disabled={submitting}
              onClick={() => {
                setSubmitError("");
                setStep("upload");
              }}
            >
              Quay lại
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Hủy
              </Button>
              <Button
                type="button"
                isLoading={submitting}
                disabled={selectedCount === 0}
                onClick={() => void handleConfirm()}
              >
                Xác nhận ({selectedCount})
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function DraftAmountInput({
  value,
  currency,
  isRefund,
  disabled,
  onChange,
}: {
  value: number;
  currency: string;
  isRefund?: boolean;
  disabled?: boolean;
  onChange: (amount: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const focusedRef = useRef(false);

  useEffect(() => {
    const el = inputRef.current;
    if (!el || focusedRef.current) return;
    const formatted = formatAmountDisplay(value, currency);
    el.value = isRefund && formatted ? `+ ${formatted}` : formatted;
  }, [value, currency, isRefund]);

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode={currency === "VND" ? "numeric" : "decimal"}
      disabled={disabled}
      className={cn(
        "h-9 w-full min-w-[7rem] rounded-md border bg-warm-50 px-2 text-right font-mono text-sm",
        isRefund
          ? "border-success/30 text-success"
          : "border-warm-200 text-warm-900",
      )}
      onFocus={(e) => {
        focusedRef.current = true;
        e.currentTarget.value =
          value === 0 ? "" : String(currency === "VND" ? Math.round(value) : value);
      }}
      onBlur={(e) => {
        focusedRef.current = false;
        const parsed = parseAmountInput(e.currentTarget.value, currency);
        onChange(parsed);
        const formatted = formatAmountDisplay(parsed, currency);
        e.currentTarget.value =
          isRefund && formatted ? `+ ${formatted}` : formatted;
      }}
      onInput={(e) => {
        const el = e.currentTarget;
        if (currency === "VND") {
          const cleaned = el.value.replace(/\D/g, "");
          if (el.value !== cleaned) el.value = cleaned;
        }
        onChange(parseAmountInput(el.value, currency));
      }}
    />
  );
}
