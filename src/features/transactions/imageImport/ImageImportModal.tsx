import { format } from "date-fns";
import { ChevronDown, ImagePlus, Loader2, Plus, ScanLine, Trash2, X } from "lucide-react";
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
import type { ImageImportDraft, ImageImportImage } from "./types";
import { newDraftId, newImageId } from "./types";

export interface ImageImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = "upload" | "review";

type ScanProgress = {
  imageIndex: number;
  totalImages: number;
  ocrProgress: number;
};

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

function createEmptyDraft(imageId: string, txnDate?: string): ImageImportDraft {
  return {
    id: newDraftId(),
    imageId,
    txnDate: txnDate ?? format(new Date(), "yyyy-MM-dd"),
    description: "",
    amount: 0,
    note: "",
    isRefund: false,
    categoryId: "",
    selected: true,
  };
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

export function ImageImportModal({ isOpen, onClose }: ImageImportModalProps) {
  const { data: sources = [] } = useSources();
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  const [step, setStep] = useState<Step>("upload");
  const [sourceId, setSourceId] = useState("");
  const [images, setImages] = useState<ImageImportImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<ImageImportDraft[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [scanError, setScanError] = useState("");
  const [scanWarnings, setScanWarnings] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef(images);
  imagesRef.current = images;
  const groupRefs = useRef<Record<string, HTMLElement | null>>({});
  const transactionsScrollRef = useRef<HTMLDivElement>(null);

  const currency =
    sources.find((s) => s.id === sourceId)?.currency ?? "VND";

  const revokeAllPreviews = useCallback((items: ImageImportImage[]) => {
    for (const img of items) {
      URL.revokeObjectURL(img.previewUrl);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setImages((prev) => {
        revokeAllPreviews(prev);
        return [];
      });
      setStep("upload");
      setSourceId("");
      setSelectedImageId(null);
      setDrafts([]);
      setCategoryId("");
      setScanning(false);
      setScanProgress(null);
      setScanError("");
      setScanWarnings([]);
      setSubmitting(false);
      setSubmitError("");
      setCollapsedGroups(new Set());
    }
  }, [isOpen, revokeAllPreviews]);

  useEffect(() => {
    return () => {
      revokeAllPreviews(imagesRef.current);
    };
  }, [revokeAllPreviews]);

  function handleAddFiles(fileList: FileList | File[] | null) {
    if (!fileList || fileList.length === 0) return;

    const newImages: ImageImportImage[] = Array.from(fileList).map((file) => ({
      id: newImageId(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newImages]);
    setScanError("");
  }

  function removeImage(imageId: string) {
    setImages((prev) => {
      const target = prev.find((img) => img.id === imageId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== imageId);
    });
    setScanError("");
  }

  function clearAllImages() {
    setImages((prev) => {
      revokeAllPreviews(prev);
      return [];
    });
    setScanError("");
  }

  async function handleScan() {
    if (!sourceId) {
      setScanError("Chọn nguồn tiền trước khi quét ảnh.");
      return;
    }
    if (images.length === 0) {
      setScanError("Chọn hoặc tải ít nhất một ảnh lên.");
      return;
    }

    setScanning(true);
    setScanError("");
    setScanWarnings([]);
    setScanProgress({
      imageIndex: 1,
      totalImages: images.length,
      ocrProgress: 0,
    });

    const allDrafts: ImageImportDraft[] = [];
    const warnings: string[] = [];

    try {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        setScanProgress({
          imageIndex: i + 1,
          totalImages: images.length,
          ocrProgress: 0,
        });

        const text = await runImageOcr(img.file, (progress) => {
          setScanProgress({
            imageIndex: i + 1,
            totalImages: images.length,
            ocrProgress: progress,
          });
        });

        const parsed = parseOcrTransactionText(text, img.id);
        if (parsed.length === 0) {
          warnings.push(
            `Ảnh ${String(i + 1)}: không nhận diện được giao dịch — thêm dòng trống để nhập thủ công.`,
          );
          allDrafts.push(createEmptyDraft(img.id));
        } else {
          allDrafts.push(...parsed);
        }
      }

      if (allDrafts.length === 0) {
        setScanError(
          "Không nhận diện được giao dịch. Thử ảnh rõ hơn hoặc chỉnh sửa thủ công ở bước sau.",
        );
        allDrafts.push(createEmptyDraft(images[0].id));
      }

      setDrafts(allDrafts);
      setScanWarnings(warnings);
      setSelectedImageId(images[0]?.id ?? null);
      setStep("review");
    } catch (e) {
      setScanError(
        e instanceof Error ? e.message : "Không quét được ảnh. Thử lại.",
      );
    } finally {
      setScanning(false);
      setScanProgress(null);
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
    const targetImageId =
      selectedImageId ?? images[0]?.id ?? drafts[drafts.length - 1]?.imageId;
    if (!targetImageId) return;

    const lastInGroup = [...drafts]
      .reverse()
      .find((d) => d.imageId === targetImageId);

    setDrafts((prev) => [
      ...prev,
      createEmptyDraft(
        targetImageId,
        lastInGroup?.txnDate ?? format(new Date(), "yyyy-MM-dd"),
      ),
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

  function toggleGroupCollapsed(imageId: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(imageId)) next.delete(imageId);
      else next.add(imageId);
      return next;
    });
  }

  function selectImageAndScroll(imageId: string) {
    setSelectedImageId(imageId);
    setCollapsedGroups((prev) => {
      if (!prev.has(imageId)) return prev;
      const next = new Set(prev);
      next.delete(imageId);
      return next;
    });

    requestAnimationFrame(() => {
      const groupEl = groupRefs.current[imageId];
      if (!groupEl) return;

      const container = transactionsScrollRef.current;
      const containerScrollable =
        container != null && container.scrollHeight > container.clientHeight + 1;

      if (containerScrollable && container) {
        const containerTop = container.getBoundingClientRect().top;
        const groupTop = groupEl.getBoundingClientRect().top;
        container.scrollTo({
          top: container.scrollTop + (groupTop - containerTop) - 8,
          behavior: "smooth",
        });
      } else {
        groupEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
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
  const selectedImage =
    images.find((img) => img.id === selectedImageId) ?? images[0] ?? null;

  const overallScanProgress = scanProgress
    ? ((scanProgress.imageIndex - 1 + scanProgress.ocrProgress) /
        scanProgress.totalImages) *
      100
    : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nhập bằng ảnh"
      description={
        step === "upload"
          ? "Chọn nguồn tiền và tải một hoặc nhiều ảnh sao kê / lịch sử giao dịch."
          : "Kiểm tra giao dịch và đối chiếu với ảnh trước khi lưu."
      }
      size="full"
      contentClassName={
        step === "review"
          ? "h-[98dvh] max-h-[98dvh] md:h-[96vh] md:max-h-[96vh]"
          : undefined
      }
      bodyClassName={
        step === "review"
          ? "flex min-h-0 flex-col overflow-y-auto py-3 md:overflow-hidden"
          : undefined
      }
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
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-warm-700">
                Ảnh giao dịch
                {images.length > 0 ? ` (${String(images.length)})` : ""}
              </span>
              {images.length > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={scanning}
                  onClick={clearAllImages}
                >
                  Xóa tất cả
                </Button>
              ) : null}
            </div>
            <div
              className={cn(
                "overflow-hidden rounded-card border-2 border-dashed transition-colors",
                images.length > 0
                  ? "border-warm-200 bg-warm-50/50"
                  : "border-warm-200 bg-warm-25/80",
              )}
            >
              {images.length > 0 ? (
                <div className="p-4">
                  <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory">
                    {images.map((img, index) => (
                      <div
                        key={img.id}
                        className="group relative w-28 shrink-0 snap-start sm:w-32"
                      >
                        <div className="overflow-hidden rounded-lg border border-warm-200 bg-surface shadow-sm">
                          <img
                            src={img.previewUrl}
                            alt={`Ảnh ${String(index + 1)}`}
                            className="aspect-[9/16] w-full object-cover object-top"
                          />
                        </div>
                        <div className="mt-1.5 flex items-center justify-between gap-1 px-0.5">
                          <span className="text-xs font-medium text-warm-600">
                            Ảnh {String(index + 1)}
                          </span>
                          <button
                            type="button"
                            disabled={scanning}
                            className="rounded p-0.5 text-warm-400 hover:bg-warm-100 hover:text-danger disabled:opacity-40"
                            aria-label={`Xóa ảnh ${String(index + 1)}`}
                            onClick={() => removeImage(img.id)}
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-warm-100 pt-3">
                    <p className="text-xs text-warm-500">
                      Vuốt ngang để xem thêm ảnh
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={scanning}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Thêm ảnh
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={scanning}
                  className="flex w-full flex-col items-center gap-3 px-6 py-10 text-center disabled:opacity-60"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex size-14 items-center justify-center rounded-full bg-warm-100">
                    <ImagePlus className="size-7 text-warm-400" aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-warm-700">
                      Chọn hoặc kéo thả ảnh vào đây
                    </p>
                    <p className="mt-1 text-xs text-warm-500">
                      PNG, JPG, ảnh chụp màn hình — có thể chọn nhiều ảnh
                    </p>
                  </div>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleAddFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          {scanning && scanProgress ? (
            <div
              className="rounded-xl border border-accent/25 bg-accent/5 px-4 py-4 text-sm text-warm-700"
              role="status"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 shrink-0 animate-spin text-accent" />
                  <span>
                    Đang quét ảnh {scanProgress.imageIndex}/
                    {scanProgress.totalImages}
                  </span>
                </div>
                <span className="font-medium text-accent">
                  {Math.round(overallScanProgress)}%
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-warm-200">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-300"
                  style={{ width: `${String(Math.round(overallScanProgress))}%` }}
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
              disabled={images.length === 0 || !sourceId}
              onClick={() => void handleScan()}
            >
              {images.length > 1
                ? `Quét ${String(images.length)} ảnh`
                : "Quét ảnh"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="shrink-0 rounded-xl border border-warm-200 bg-warm-25/50 p-3 sm:p-4">
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              <div>
                <span className="mb-1 block text-xs font-medium text-warm-500">
                  Nguồn tiền
                </span>
                <p className="text-sm font-medium text-warm-900">
                  {sources.find((s) => s.id === sourceId)?.name ?? "—"}
                </p>
              </div>
              <div>
                <span className="mb-1.5 block text-xs font-medium text-warm-500">
                  Gán danh mục hàng loạt
                </span>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
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
                    className="shrink-0"
                    disabled={submitting || !categoryId.trim()}
                    onClick={applyCategoryToSelectedExpenses}
                  >
                    Áp dụng
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {(scanWarnings.length > 0 || refundCount > 0) && (
            <div className="shrink-0 space-y-2">
              {scanWarnings.length > 0 ? (
                <div className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-warm-600">
                  {scanWarnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              ) : null}
              {refundCount > 0 ? (
                <p className="rounded-lg border border-success/25 bg-success/5 px-3 py-2 text-xs text-warm-600">
                  {refundCount} giao dịch hoàn trả (+) — không nhập riêng; cặp
                  cùng số tiền được bỏ chọn tự động.
                </p>
              ) : null}
            </div>
          )}

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
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

          <div className="flex min-h-0 flex-1 flex-col gap-3 md:grid md:grid-cols-[minmax(0,1fr)_minmax(380px,54%)] md:gap-4 md:overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(420px,58%)] xl:grid-cols-[minmax(0,1fr)_620px] 2xl:grid-cols-[minmax(0,1fr)_680px]">
            <aside className="sticky top-0 z-30 shrink-0 border-b border-warm-100 bg-surface pb-3 md:static md:order-2 md:flex md:min-h-0 md:flex-col md:gap-2 md:border-b-0 md:pb-0">
              <div className="flex items-center justify-between gap-2 px-0.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-warm-500">
                  Ảnh đối chiếu
                </span>
                {selectedImage ? (
                  <span className="text-xs text-warm-400">
                    Ảnh{" "}
                    {String(
                      images.findIndex((img) => img.id === selectedImage.id) + 1,
                    )}
                    /{String(images.length)}
                  </span>
                ) : null}
              </div>
              <div className="flex h-[min(68vh,720px)] min-h-[20rem] items-center justify-center overflow-hidden rounded-xl border border-warm-200 bg-warm-100/80 p-2 md:h-auto md:min-h-[32rem] md:flex-1">
                {selectedImage ? (
                  <img
                    src={selectedImage.previewUrl}
                    alt="Ảnh đang xem"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <p className="text-sm text-warm-400">Chọn ảnh để đối chiếu</p>
                )}
              </div>
              <div className="mt-1.5 flex shrink-0 gap-1.5 overflow-x-auto pb-0.5 md:mt-1">
                {images.map((img, index) => {
                  const isSelected = selectedImageId === img.id;
                  const txnCount = drafts.filter((d) => d.imageId === img.id).length;
                  return (
                    <button
                      key={img.id}
                      type="button"
                      className={cn(
                        "relative shrink-0 overflow-hidden rounded-md border-2 transition-all",
                        isSelected
                          ? "border-accent shadow-md ring-2 ring-accent/25"
                          : "border-warm-200 hover:border-warm-300",
                      )}
                      aria-label={`Xem ảnh ${String(index + 1)} và cuộn tới giao dịch`}
                      aria-pressed={isSelected}
                      onClick={() => selectImageAndScroll(img.id)}
                    >
                      <img
                        src={img.previewUrl}
                        alt={`Ảnh ${String(index + 1)}`}
                        className="h-14 w-10 object-cover object-top sm:h-16 sm:w-11"
                      />
                      <span
                        className={cn(
                          "absolute inset-x-0 bottom-0 py-px text-center text-[9px] font-semibold leading-tight text-white",
                          isSelected ? "bg-accent/90" : "bg-black/60",
                        )}
                      >
                        {String(index + 1)} · {String(txnCount)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <div
              ref={transactionsScrollRef}
              className="order-2 min-h-0 md:order-1 md:overflow-auto md:rounded-xl md:border md:border-warm-200"
            >
              {images.map((img, imageIndex) => {
                const groupDrafts = drafts.filter((d) => d.imageId === img.id);
                if (groupDrafts.length === 0) return null;

                const isActiveGroup = selectedImageId === img.id;
                const isCollapsed = collapsedGroups.has(img.id);

                return (
                  <section
                    key={img.id}
                    ref={(el) => {
                      groupRefs.current[img.id] = el;
                    }}
                    className={cn(
                      "scroll-mt-[calc(min(68vh,720px)+4.5rem)] border-b border-warm-200 last:border-b-0 md:scroll-mt-0",
                      isActiveGroup && "bg-accent/[0.02]",
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-1 border-b px-2 py-2 md:sticky md:top-0 md:z-20",
                        isActiveGroup
                          ? "border-accent/20 bg-accent/10"
                          : "border-warm-100 bg-warm-50",
                      )}
                    >
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-warm-500 hover:bg-warm-100 hover:text-warm-800"
                        aria-expanded={!isCollapsed}
                        aria-label={
                          isCollapsed
                            ? `Mở rộng giao dịch ảnh ${String(imageIndex + 1)}`
                            : `Thu gọn giao dịch ảnh ${String(imageIndex + 1)}`
                        }
                        onClick={() => toggleGroupCollapsed(img.id)}
                      >
                        <ChevronDown
                          className={cn(
                            "size-4 transition-transform duration-200",
                            isCollapsed && "-rotate-90",
                          )}
                          aria-hidden
                        />
                      </button>
                      <button
                        type="button"
                        className={cn(
                          "flex min-w-0 flex-1 items-center justify-between gap-2 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-warm-100/80",
                          isActiveGroup ? "text-accent" : "text-warm-700",
                        )}
                        onClick={() => selectImageAndScroll(img.id)}
                      >
                        <span className="truncate text-sm font-semibold">
                          Ảnh {String(imageIndex + 1)}
                        </span>
                        <span className="shrink-0 rounded-full bg-surface/90 px-2 py-0.5 text-xs text-warm-500">
                          {groupDrafts.length} giao dịch
                        </span>
                      </button>
                    </div>

                    {!isCollapsed ? (
                      <>
                        <div className="divide-y divide-warm-100 md:hidden">
                          {groupDrafts.map((row) => (
                            <DraftCardRow
                              key={row.id}
                              row={row}
                              currency={currency}
                              submitting={submitting}
                              canRemove={drafts.length > 1}
                              onUpdate={(patch) => updateDraft(row.id, patch)}
                              onRemove={() => removeDraft(row.id)}
                            />
                          ))}
                        </div>
                        <div className="hidden overflow-x-auto md:block">
                          <table className="w-full min-w-[580px] text-sm">
                            <thead className="bg-warm-25 text-left text-[11px] font-medium uppercase tracking-wide text-warm-500">
                              <tr className="border-b border-warm-100">
                                <th className="w-9 px-2 py-2">
                                  <span className="sr-only">Chọn</span>
                                </th>
                                <th className="w-[7.5rem] px-2 py-2">Ngày</th>
                                <th className="min-w-[8rem] px-2 py-2">Mô tả</th>
                                <th className="w-[6.5rem] px-2 py-2 text-right">
                                  Số tiền
                                </th>
                                <th className="min-w-[9rem] px-2 py-2">Danh mục</th>
                                <th className="w-9 px-1 py-2" aria-label="Xóa" />
                              </tr>
                            </thead>
                            <tbody>
                              {groupDrafts.map((row) => (
                                <DraftTableRow
                                  key={row.id}
                                  row={row}
                                  currency={currency}
                                  submitting={submitting}
                                  canRemove={drafts.length > 1}
                                  onUpdate={(patch) => updateDraft(row.id, patch)}
                                  onRemove={() => removeDraft(row.id)}
                                />
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : null}
                  </section>
                );
              })}
            </div>
          </div>

          {submitError ? (
            <p className="shrink-0 text-sm text-danger" role="alert">
              {submitError}
            </p>
          ) : null}

          <div className="sticky bottom-0 z-30 -mx-6 flex shrink-0 flex-wrap justify-between gap-2 border-t border-warm-100 bg-surface px-6 py-3 md:static md:mx-0 md:px-0">
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

function DraftCardRow({
  row,
  currency,
  submitting,
  canRemove,
  onUpdate,
  onRemove,
}: {
  row: ImageImportDraft;
  currency: string;
  submitting: boolean;
  canRemove: boolean;
  onUpdate: (patch: Partial<ImageImportDraft>) => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={cn(
        "space-y-3 p-3",
        row.isRefund && "bg-success/5",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={row.selected}
            disabled={submitting}
            className="size-4 rounded border-warm-300 text-accent"
            onChange={(e) => onUpdate({ selected: e.target.checked })}
          />
          <span className="text-xs font-medium text-warm-500">Chọn</span>
        </label>
        <button
          type="button"
          disabled={submitting || !canRemove}
          className="rounded p-1 text-warm-400 hover:bg-warm-100 hover:text-danger disabled:opacity-40"
          aria-label="Xóa dòng"
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 sm:col-span-1">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-warm-500">
            Ngày
          </span>
          <input
            type="date"
            value={row.txnDate}
            disabled={submitting || !row.selected}
            className="h-10 w-full rounded-md border border-warm-200 bg-warm-50 px-2 text-sm"
            onChange={(e) => onUpdate({ txnDate: e.target.value })}
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-warm-500">
            Số tiền
          </span>
          <DraftAmountInput
            value={row.amount}
            currency={currency}
            isRefund={row.isRefund}
            disabled={submitting || !row.selected}
            onChange={(amount) => onUpdate({ amount })}
          />
        </div>
      </div>

      <div>
        <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-warm-500">
          Mô tả
        </span>
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
            className="h-10 min-w-0 flex-1 rounded-md border border-warm-200 bg-warm-50 px-2 text-sm"
            onChange={(e) => onUpdate({ description: e.target.value })}
          />
        </div>
        {row.note ? (
          <p className="mt-1 text-[11px] text-warm-400">{row.note}</p>
        ) : null}
      </div>

      {!row.isRefund ? (
        <div>
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-warm-500">
            Danh mục
          </span>
          <CategorySelector
            kind="expense"
            value={row.categoryId || undefined}
            onChange={(id) => onUpdate({ categoryId: id ?? "" })}
            disabled={submitting || !row.selected}
            placeholder="Danh mục"
            className="[&_button]:h-10 [&_button]:w-full [&_button]:text-sm"
          />
        </div>
      ) : null}
    </div>
  );
}

function DraftTableRow({
  row,
  currency,
  submitting,
  canRemove,
  onUpdate,
  onRemove,
}: {
  row: ImageImportDraft;
  currency: string;
  submitting: boolean;
  canRemove: boolean;
  onUpdate: (patch: Partial<ImageImportDraft>) => void;
  onRemove: () => void;
}) {
  return (
    <tr
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
          onChange={(e) => onUpdate({ selected: e.target.checked })}
        />
      </td>
      <td className="px-2 py-1.5 align-top">
        <input
          type="date"
          value={row.txnDate}
          disabled={submitting || !row.selected}
          className="h-9 w-full min-w-[7rem] rounded-md border border-warm-200 bg-warm-50 px-2 text-sm"
          onChange={(e) => onUpdate({ txnDate: e.target.value })}
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
            onChange={(e) => onUpdate({ description: e.target.value })}
          />
        </div>
        {row.note ? (
          <p className="mt-1 line-clamp-2 text-[11px] text-warm-400">{row.note}</p>
        ) : null}
      </td>
      <td className="px-2 py-1.5 align-top">
        <DraftAmountInput
          value={row.amount}
          currency={currency}
          isRefund={row.isRefund}
          disabled={submitting || !row.selected}
          onChange={(amount) => onUpdate({ amount })}
        />
      </td>
      <td className="px-2 py-1.5 align-top">
        {row.isRefund ? (
          <span className="block py-2 text-xs text-warm-400">—</span>
        ) : (
          <CategorySelector
            kind="expense"
            value={row.categoryId || undefined}
            onChange={(id) => onUpdate({ categoryId: id ?? "" })}
            disabled={submitting || !row.selected}
            placeholder="Danh mục"
            className="[&_button]:h-9 [&_button]:text-xs"
          />
        )}
      </td>
      <td className="px-1 py-1.5 align-top">
        <button
          type="button"
          disabled={submitting || !canRemove}
          className="rounded p-1 text-warm-400 hover:bg-warm-100 hover:text-danger disabled:opacity-40"
          aria-label="Xóa dòng"
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
        </button>
      </td>
    </tr>
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
        "h-9 w-full min-w-[5.5rem] rounded-md border bg-warm-50 px-2 text-right font-mono text-sm",
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
