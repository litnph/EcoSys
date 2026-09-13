import { ChevronDown, FileImage, ImagePlus, Loader2, Plus, ScanLine, Trash2, X } from "lucide-react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import {
  memo,
  type DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";

import { CategorySelector } from "@/features/categories/components/CategorySelector";
import { matchTransactionContents } from "@/features/settings/api/classificationRulesApi";
import { TagPicker } from "@/features/tags/components/TagPicker";
import { invalidateBudgetAwareness } from "@/features/budgets/lib/invalidateBudgetAwareness";
import { invalidateDashboard } from "@/features/dashboard/lib/invalidateDashboard";
import { debtKeys } from "@/features/debt/api/debtKeys";
import { sourceKeys } from "@/features/sources/api/sourceKeys";
import { MoneySourceSelect } from "@/features/sources/components";
import { useSources } from "@/features/sources/hooks";
import { getFinanceApiErrorMessage } from "@/features/sources/utils/apiError";
import { useImageImportTypeSettings } from "@/features/settings/hooks/useImageImportSettings";
import { useTranslations } from "@/i18n/hooks";
import { Button } from "@/shared/components/ui/Button";
import { DataTableScrollRegion } from "@/shared/components/ui/DataTableScrollRegion";
import { Modal } from "@/shared/components/ui/Modal";
import { useIsMdUp } from "@/shared/hooks/useMediaQuery";
import { formatNumber } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";
import { useToastStore } from "@/shared/stores/toastStore";

import {
  commitTransactionImport,
  previewTransactionImport,
} from "../api/transactionsApi";
import { transactionKeys } from "../api/transactionKeys";
import { resolveExpenseApiType } from "../components/TransactionForm/resolveExpenseApiType";
import { applyClassificationMatches } from "./autoCategorizeDrafts";
import { parseImageImportOcr } from "./parseImageImportOcr";
import { runImageOcr } from "./runImageOcr";
import type {
  ImageImportDraft,
  ImageImportImage,
  ImageImportKind,
  ImageImportReviewField,
} from "./types";
import {
  applyImageImportDescriptionPreference,
  IMAGE_IMPORT_KIND_DEFINITIONS,
  newDraftId,
  newImageId,
  resolveImageImportTypeSettings,
} from "./types";

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

function formatReviewFields(
  fields: ImageImportReviewField[],
  t: TFunction<"imageImport">,
): string {
  return fields.map((field) => {
    switch (field) {
      case "txnDate":
        return t("date");
      case "description":
        return t("description");
      case "amount":
        return t("amount");
      case "direction":
        return t("direction");
    }
  }).join(", ");
}

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

function createEmptyDraft(
  imageId: string,
  txnDate?: string,
  includeDescription = true,
): ImageImportDraft {
  return applyImageImportDescriptionPreference([{
    id: newDraftId(),
    imageId,
    txnDate: txnDate ?? "",
    description: "",
    amount: 0,
    note: "",
    direction: "expense",
    isRefund: false,
    categoryId: "",
    tagIds: [],
    reviewFields: txnDate
      ? ["description", "amount"]
      : ["txnDate", "description", "amount"],
    selected: true,
  }], includeDescription)[0];
}

export function ImageImportModal({ isOpen, onClose }: ImageImportModalProps) {
  const t = useTranslations("imageImport");
  const sourcesQuery = useSources();
  const imageTypeSettingsQuery = useImageImportTypeSettings(isOpen);
  const sources = useMemo(() => sourcesQuery.data ?? [], [sourcesQuery.data]);
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const isMdUp = useIsMdUp();

  const [step, setStep] = useState<Step>("upload");
  const [importKind, setImportKind] = useState<ImageImportKind>("statement");
  const [sourceId, setSourceId] = useState("");
  const [includeDescription, setIncludeDescription] = useState(true);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
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
  const [groupDateValues, setGroupDateValues] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef(images);
  imagesRef.current = images;
  const groupRefs = useRef<Record<string, HTMLElement | null>>({});
  const transactionsScrollRef = useRef<HTMLDivElement>(null);
  const autoAppliedSourceRef = useRef<string | null>(null);
  const appliedSourceConfigRef = useRef<string | null>(null);

  const imageTypeSettings = useMemo(
    () => resolveImageImportTypeSettings(
      imageTypeSettingsQuery.data,
      (labelKey) => t(labelKey),
    ),
    [imageTypeSettingsQuery.data, t],
  );
  const activeTypeDefinition = IMAGE_IMPORT_KIND_DEFINITIONS.find(
    (definition) => definition.type === importKind,
  );
  const activeTypeSetting = imageTypeSettings.find(
    (setting) => setting.type === importKind,
  );
  const requiresVnd = activeTypeDefinition?.requiresVnd ?? false;

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
      setImportKind("statement");
      setSourceId("");
      setIncludeDescription(true);
      setIsDraggingFiles(false);
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
      setGroupDateValues({});
      autoAppliedSourceRef.current = null;
      appliedSourceConfigRef.current = null;
    }
  }, [isOpen, revokeAllPreviews]);

  useEffect(() => {
    return () => {
      revokeAllPreviews(imagesRef.current);
    };
  }, [revokeAllPreviews]);

  useEffect(() => {
    if (
      !isOpen
      || imageTypeSettingsQuery.isPending
      || sourcesQuery.isPending
    ) {
      return;
    }

    const configuredSourceId = activeTypeSetting?.sourceId ?? null;
    const availableConfiguredSource = configuredSourceId
      && sources.some((source) => source.id === configuredSourceId)
      ? configuredSourceId
      : null;
    const sourceConfigKey = `${importKind}:${availableConfiguredSource ?? ""}`;
    if (appliedSourceConfigRef.current === sourceConfigKey) return;
    appliedSourceConfigRef.current = sourceConfigKey;

    setSourceId((currentSourceId) => {
      if (availableConfiguredSource) {
        autoAppliedSourceRef.current = availableConfiguredSource;
        return availableConfiguredSource;
      }

      const shouldClearPreviousAutoSource =
        autoAppliedSourceRef.current !== null
        && currentSourceId === autoAppliedSourceRef.current;
      autoAppliedSourceRef.current = null;
      return shouldClearPreviousAutoSource ? "" : currentSourceId;
    });
  }, [
    activeTypeSetting?.sourceId,
    importKind,
    isOpen,
    imageTypeSettingsQuery.isPending,
    sources,
    sourcesQuery.isPending,
  ]);

  function handleAddFiles(fileList: FileList | File[] | null) {
    if (!fileList || fileList.length === 0) return;

    const selectedFiles = Array.from(fileList);
    const imageFiles = selectedFiles.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      setScanError("Chỉ hỗ trợ tệp ảnh PNG, JPG hoặc ảnh chụp màn hình.");
      return;
    }

    const newImages: ImageImportImage[] = imageFiles.map((file) => ({
      id: newImageId(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newImages]);
    setScanError(
      imageFiles.length < selectedFiles.length
        ? `Đã bỏ qua ${String(selectedFiles.length - imageFiles.length)} tệp không phải ảnh.`
        : "",
    );
  }

  function handleFileDrag(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (scanning || !event.dataTransfer.types.includes("Files")) return;
    event.dataTransfer.dropEffect = "copy";
    setIsDraggingFiles(true);
  }

  function handleFileDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingFiles(false);
    if (scanning) return;
    handleAddFiles(event.dataTransfer.files);
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
    if (requiresVnd && currency !== "VND") {
      setScanError(t("kindVndOnly", { type: activeTypeSetting?.displayName ?? "" }));
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

        const ocrResult = await runImageOcr(img.file, (progress) => {
          setScanProgress({
            imageIndex: i + 1,
            totalImages: images.length,
            ocrProgress: progress,
          });
        });

        const parsed = applyImageImportDescriptionPreference(
          parseImageImportOcr(ocrResult, img.id, importKind),
          includeDescription,
        );
        if (parsed.length === 0) {
          warnings.push(
            `Ảnh ${String(i + 1)}: không nhận diện được giao dịch — thêm dòng trống để nhập thủ công.`,
          );
          allDrafts.push(createEmptyDraft(img.id, undefined, includeDescription));
        } else {
          allDrafts.push(...parsed);
        }
      }

      if (allDrafts.length === 0) {
        setScanError(
          "Không nhận diện được giao dịch. Thử ảnh rõ hơn hoặc chỉnh sửa thủ công ở bước sau.",
        );
        allDrafts.push(createEmptyDraft(images[0].id, undefined, includeDescription));
      }

      try {
        const classifiableDrafts = allDrafts.filter(
          (draft) => !draft.isRefund && draft.direction === "expense",
        );
        const matches = classifiableDrafts.length > 0
          ? await matchTransactionContents(classifiableDrafts.map((draft) => ({
              key: draft.id,
              content: draft.description.slice(0, 512) || null,
            })))
          : [];
        setDrafts(applyClassificationMatches(allDrafts, matches));
      } catch {
        setDrafts(allDrafts);
        warnings.push(t("classificationUnavailable"));
      }
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

  const updateDraft = useCallback((id: string, patch: Partial<ImageImportDraft>) => {
    setDrafts((prev) =>
      prev.map((draft) => {
        if (draft.id !== id) return draft;
        const editedFields = Object.keys(patch).filter(
          (field): field is ImageImportReviewField =>
            field === "txnDate" ||
            field === "description" ||
            field === "amount" ||
            field === "direction",
        );
        return {
          ...draft,
          ...patch,
          reviewFields: draft.reviewFields.filter(
            (field) => !editedFields.includes(field),
          ),
        };
      }),
    );
  }, []);

  const removeDraft = useCallback((id: string) => {
    setDrafts((prev) =>
      prev.length <= 1 ? prev : prev.filter((d) => d.id !== id),
    );
  }, []);

  const applyDateToUndatedDrafts = useCallback(
    (imageId: string, txnDate: string) => {
      if (!txnDate) return;
      setDrafts((prev) =>
        prev.map((draft) =>
          draft.imageId === imageId && !draft.txnDate
            ? {
                ...draft,
                txnDate,
                reviewFields: draft.reviewFields.filter(
                  (field) => field !== "txnDate",
                ),
              }
            : draft,
        ),
      );
      setGroupDateValues((prev) => {
        const next = { ...prev };
        delete next[imageId];
        return next;
      });
    },
    [],
  );

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
        lastInGroup?.txnDate,
        includeDescription,
      ),
    ]);
  }

  function applyCategoryToSelectedExpenses() {
    if (!categoryId.trim()) return;
    setDrafts((prev) =>
      prev.map((d) =>
        d.selected && !d.isRefund && d.direction === "expense"
          ? { ...d, categoryId }
          : d,
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
      if (includeDescription && !row.description.trim()) {
        setSubmitError(`Dòng ${String(i + 1)}: nhập mô tả.`);
        return;
      }
      if (!row.categoryId.trim() && !(row.direction === "expense" && categoryId.trim())) {
        setSubmitError(t("rowCategoryRequired", { row: i + 1 }));
        return;
      }
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const items = selected.map((row) => ({
          clientRequestId: row.id,
          type: row.direction === "income"
            ? "income" as const
            : resolveExpenseApiType(sourceId, sources),
          amount: row.amount,
          sourceId,
          categoryId: row.categoryId.trim()
            || (row.direction === "expense" ? categoryId.trim() : "")
            || null,
          txnDate: row.txnDate,
          description: row.description.trim(),
          note: row.note.trim() || null,
          tagIds: row.tagIds,
      }));
      const preview = await previewTransactionImport(items);
      if (!preview.isValid) {
        const failed = preview.rows.find((row) => !row.success);
        throw new Error(failed?.message ?? "Dữ liệu nhập không hợp lệ.");
      }
      const result = await commitTransactionImport(items);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: transactionKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
        queryClient.invalidateQueries({ queryKey: debtKeys.all }),
        queryClient.invalidateQueries({ queryKey: sourceKeys.lists() }),
      ]);
      invalidateDashboard(queryClient);
      await invalidateBudgetAwareness(queryClient);

      addToast({
        type: "success",
        title: `Đã nhập ${String(result.createdCount)} giao dịch từ ảnh`,
      });
      onClose();
    } catch (err) {
      setSubmitError(getFinanceApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const draftsByImageId = useMemo(() => {
    const groups = new Map<string, ImageImportDraft[]>();
    for (const draft of drafts) {
      const group = groups.get(draft.imageId);
      if (group) group.push(draft);
      else groups.set(draft.imageId, [draft]);
    }
    return groups;
  }, [drafts]);
  const { selectedCount, expenseCount, incomeCount, refundCount } = useMemo(() => {
    let selectedRows = 0;
    let expenses = 0;
    let incomes = 0;
    let refunds = 0;
    for (const draft of drafts) {
      if (draft.isRefund) refunds++;
      else if (draft.direction === "income") incomes++;
      else expenses++;
      if (draft.selected && !draft.isRefund) selectedRows++;
    }
    return {
      selectedCount: selectedRows,
      expenseCount: expenses,
      incomeCount: incomes,
      refundCount: refunds,
    };
  }, [drafts]);
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
          ? t("uploadDescription")
          : "Kiểm tra giao dịch và đối chiếu với ảnh trước khi lưu."
      }
      size="full"
      contentClassName={cn(
        step === "upload"
          ? "!max-w-6xl"
          : "h-[90dvh] max-h-[860px]",
      )}
      bodyClassName="flex min-h-0 flex-col overflow-hidden py-3"
    >
      {step === "upload" ? (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 md:flex md:flex-col md:overflow-hidden">
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(12rem,0.8fr)_minmax(14rem,1fr)_auto] lg:items-end">
              <div className="min-w-0">
                <label
                  htmlFor="image-import-kind"
                  className="mb-1 block text-sm font-medium text-warm-700"
                >
                  {t("imageKind")}
                </label>
                <select
                  id="image-import-kind"
                  value={importKind}
                  disabled={scanning}
                  className={cn(
                    "h-11 w-full min-w-0 truncate rounded-button border border-warm-200 bg-warm-50 px-3 text-sm text-warm-900",
                    "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                  )}
                  onChange={(event) => {
                    setImportKind(event.target.value as ImageImportKind);
                    setScanError("");
                  }}
                >
                  {IMAGE_IMPORT_KIND_DEFINITIONS.map((option) => {
                    const setting = imageTypeSettings.find(
                      (entry) => entry.type === option.type,
                    );
                    return (
                      <option key={option.type} value={option.type}>
                        {setting?.displayName ?? t(option.labelKey)}
                      </option>
                    );
                  })}
                </select>
              </div>

              <MoneySourceSelect
                sources={sources}
                value={sourceId}
                label={t("source")}
                placeholder={t("selectSource")}
                emptyLabel={t("selectSource")}
                onChange={(nextSourceId) => {
                  autoAppliedSourceRef.current = null;
                  setSourceId(nextSourceId);
                }}
                disabled={scanning}
              />

              <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-button border border-warm-200 bg-warm-25 px-3 text-sm font-medium text-warm-700 lg:mb-0">
                <input
                  type="checkbox"
                  checked={includeDescription}
                  disabled={scanning}
                  className="size-4 rounded border-warm-300 text-accent focus:ring-accent"
                  onChange={(event) => setIncludeDescription(event.target.checked)}
                />
                <span className="whitespace-nowrap">{t("includeDescription")}</span>
              </label>
            </div>
          {sourcesQuery.isLoading ? (
            <p className="-mt-3 text-xs text-warm-500" role="status">
              {t("sourceLoading")}
            </p>
          ) : sourcesQuery.isError ? (
            <div className="-mt-3 flex flex-wrap items-center gap-2 text-xs text-danger" role="alert">
              <span>{t("sourceLoadError")}</span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={scanning}
                onClick={() => void sourcesQuery.refetch()}
              >
                {t("retry")}
              </Button>
            </div>
          ) : sources.length === 0 ? (
            <p className="-mt-3 text-xs text-warm-500">
              {t("sourceEmpty")}
            </p>
          ) : null}
          {requiresVnd && sourceId && currency !== "VND" ? (
            <p className="-mt-3 text-xs font-medium text-danger" role="alert">
              {t("kindVndOnly", { type: activeTypeSetting?.displayName ?? "" })}
            </p>
          ) : null}

          <div className="shrink-0">
            <div className="mb-2 flex min-h-8 items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-sm font-medium text-warm-700">
                  Ảnh giao dịch
                </span>
                {images.length > 0 ? (
                  <span className="rounded-full bg-warm-100 px-2 py-0.5 text-xs font-medium text-warm-600">
                    {String(images.length)} ảnh
                  </span>
                ) : null}
              </div>
              {images.length > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  leftIcon={<Trash2 className="size-3.5" aria-hidden />}
                  disabled={scanning}
                  onClick={clearAllImages}
                >
                  Xóa tất cả
                </Button>
              ) : null}
            </div>
            <div
              className={cn(
                "relative overflow-hidden rounded-card border-2 border-dashed transition-colors",
                isDraggingFiles && "border-accent bg-accent/5 ring-4 ring-accent/10",
                images.length > 0
                  ? "min-h-24 border-warm-200 bg-warm-25/60"
                  : "min-h-32 border-warm-200 bg-warm-25/80",
              )}
              onDragEnter={handleFileDrag}
              onDragOver={handleFileDrag}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setIsDraggingFiles(false);
                }
              }}
              onDrop={handleFileDrop}
            >
              {images.length > 0 ? (
                <div className="flex min-h-24 items-center gap-3 p-3">
                  <TooltipPrimitive.Provider delayDuration={200}>
                    <div className="scrollbar-stable flex min-w-0 flex-1 items-center gap-3 overflow-x-auto p-1">
                      {images.map((img, index) => (
                        <div key={img.id} className="relative shrink-0">
                          <TooltipPrimitive.Root>
                            <TooltipPrimitive.Trigger asChild>
                              <span
                                tabIndex={0}
                                aria-label={`Ảnh ${String(index + 1)}: ${img.file.name}`}
                                className="relative flex size-14 items-center justify-center rounded-lg border border-warm-200 bg-surface text-warm-500 outline-none transition-colors hover:border-accent/50 hover:bg-accent/5 focus-visible:ring-2 focus-visible:ring-accent/30"
                              >
                                <FileImage className="size-6" aria-hidden />
                                <span className="absolute bottom-1 right-1 min-w-4 rounded bg-warm-100 px-1 text-center text-[10px] font-semibold leading-4 text-warm-600">
                                  {String(index + 1)}
                                </span>
                              </span>
                            </TooltipPrimitive.Trigger>
                            <TooltipPrimitive.Portal>
                              <TooltipPrimitive.Content
                                sideOffset={6}
                                collisionPadding={12}
                                className="z-[210] max-w-72 break-all rounded-md bg-warm-900 px-2.5 py-1.5 text-xs text-surface elevation-menu"
                              >
                                {img.file.name}
                              </TooltipPrimitive.Content>
                            </TooltipPrimitive.Portal>
                          </TooltipPrimitive.Root>
                          <button
                            type="button"
                            disabled={scanning}
                            className="absolute -right-2 -top-2 flex size-7 items-center justify-center rounded-full border border-warm-200 bg-surface text-warm-500 elevation-menu hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-40"
                            aria-label={`${t("removeImage")} ${String(index + 1)}: ${img.file.name}`}
                            onClick={() => removeImage(img.id)}
                          >
                            <X className="size-3.5" aria-hidden />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        disabled={scanning}
                        className="flex h-14 shrink-0 items-center gap-2 rounded-lg border border-dashed border-warm-300 bg-surface px-3 text-sm font-medium text-warm-600 outline-none transition-colors hover:border-accent hover:bg-accent/5 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImagePlus className="size-4" aria-hidden />
                        Thêm ảnh
                      </button>
                    </div>
                  </TooltipPrimitive.Provider>
                  <p className="hidden max-w-44 shrink-0 text-right text-xs leading-relaxed text-warm-500 lg:block">
                    Kéo thả thêm ảnh vào khung này
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={scanning}
                  className="flex min-h-32 w-full items-center justify-center gap-3 px-5 py-4 text-left outline-none transition-colors hover:bg-warm-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/30 disabled:opacity-60 sm:text-center"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warm-100">
                    <ImagePlus className="size-5 text-warm-400" aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-warm-700">
                      Chọn ảnh hoặc kéo thả vào đây
                    </p>
                    <p className="mt-1 text-xs text-warm-500">
                      PNG, JPG hoặc ảnh chụp màn hình · Có thể chọn nhiều ảnh
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

          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-warm-100 pt-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="button"
              leftIcon={<ScanLine className="size-4" aria-hidden />}
              isLoading={scanning}
              disabled={
                images.length === 0
                || !sourceId
                || (requiresVnd && currency !== "VND")
              }
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
          <div className="scrollbar-stable flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto md:grid md:grid-cols-[minmax(0,1fr)_minmax(18rem,28%)] md:grid-rows-[auto_auto_auto_minmax(0,1fr)_auto] md:gap-x-4 md:gap-y-3 md:overflow-hidden xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="shrink-0 rounded-xl border border-warm-200 bg-warm-25/50 p-3 sm:p-4 md:col-start-1 md:row-start-1">
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-[minmax(10rem,0.7fr)_minmax(14rem,1fr)_minmax(18rem,1.5fr)]">
              <div>
                <span className="mb-1 block text-xs font-medium text-warm-500">
                  Nguồn tiền
                </span>
                <p className="text-sm font-medium text-warm-900">
                  {sources.find((s) => s.id === sourceId)?.name ?? "—"}
                </p>
              </div>
              <div>
                <span className="mb-1 block text-xs font-medium text-warm-500">
                  {t("imageKind")}
                </span>
                <p className="truncate text-sm font-medium text-warm-900" title={activeTypeSetting?.displayName}>
                  {activeTypeSetting?.displayName ?? t(activeTypeDefinition?.labelKey ?? "statementKind")}
                </p>
              </div>
              <div className="sm:col-span-2 xl:col-span-1">
                <span className="mb-1.5 block text-xs font-medium text-warm-500">
                  {t("bulkExpenseCategory")}
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
            <div className="shrink-0 space-y-2 md:col-start-1 md:row-start-2">
              {scanWarnings.length > 0 ? (
                <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
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

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 md:col-start-1 md:row-start-3">
            <p className="text-sm text-warm-600">
              {t("selectionSummary", {
                selected: selectedCount,
                expenses: expenseCount,
                incomes: incomeCount,
              })}
              {refundCount > 0 ? ` · ${t("refundCount", { count: refundCount })}` : ""}
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

          <div className="contents">
            <aside className="shrink-0 border-b border-warm-100 bg-surface pb-3 md:col-start-2 md:row-span-5 md:row-start-1 md:flex md:min-h-0 md:flex-col md:gap-2 md:border-b-0 md:pb-0">
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
              <div className="flex h-[min(76dvh,840px)] min-h-[20rem] items-center justify-center overflow-hidden rounded-xl border border-warm-200 bg-warm-100/80 p-2 md:h-auto md:min-h-0 md:flex-1">
                {selectedImage ? (
                  <img
                    src={selectedImage.previewUrl}
                    alt="Ảnh đang xem"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <p className="text-sm text-warm-400">Chọn ảnh để đối chiếu</p>
                )}
              </div>
              <div className="mt-1.5 flex shrink-0 gap-1.5 overflow-x-auto pb-0.5 md:mt-1">
                {images.map((img, index) => {
                  const isSelected = selectedImageId === img.id;
                  const txnCount = draftsByImageId.get(img.id)?.length ?? 0;
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
                        loading="lazy"
                        decoding="async"
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
              className="scrollbar-stable min-h-0 md:col-start-1 md:row-start-4 md:overflow-auto md:rounded-xl md:border md:border-warm-200"
            >
              {images.map((img, imageIndex) => {
                const groupDrafts = draftsByImageId.get(img.id) ?? [];
                if (groupDrafts.length === 0) return null;

                const isActiveGroup = selectedImageId === img.id;
                const isCollapsed = collapsedGroups.has(img.id);
                const undatedCount = groupDrafts.reduce(
                  (count, draft) => count + (draft.txnDate ? 0 : 1),
                  0,
                );

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
                        "isolate flex flex-wrap items-center gap-1 border-b px-2 py-2 md:sticky md:top-0 md:z-30",
                        isActiveGroup
                          ? "border-accent/20 bg-accent/10"
                          : "border-warm-100 bg-warm-50",
                      )}
                    >
                      <button
                        type="button"
                        className="flex size-9 shrink-0 items-center justify-center rounded-md text-warm-500 hover:bg-warm-100 hover:text-warm-800"
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
                      {undatedCount > 0 ? (
                        <div className="flex w-full flex-wrap items-center gap-2 border-t border-current/10 pt-2 sm:ml-8 sm:flex-nowrap">
                          <label
                            htmlFor={`group-date-${img.id}`}
                            className="shrink-0 text-xs font-medium text-warm-600"
                          >
                            Điền ngày cho {undatedCount} dòng trống
                          </label>
                          <input
                            id={`group-date-${img.id}`}
                            type="date"
                            value={groupDateValues[img.id] ?? ""}
                            disabled={submitting}
                            className="h-8 min-w-[8.5rem] rounded-md border border-warm-200 bg-surface px-2 text-xs text-warm-800"
                            onChange={(event) =>
                              setGroupDateValues((prev) => ({
                                ...prev,
                                [img.id]: event.target.value,
                              }))
                            }
                          />
                          <button
                            type="button"
                            disabled={submitting || !groupDateValues[img.id]}
                            className="h-8 rounded-md bg-accent px-3 text-xs font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                            onClick={() =>
                              applyDateToUndatedDrafts(
                                img.id,
                                groupDateValues[img.id] ?? "",
                              )
                            }
                          >
                            Áp dụng
                          </button>
                        </div>
                      ) : null}
                    </div>

                    {!isCollapsed ? (
                      <>
                        {isMdUp ? (
                          <DataTableScrollRegion
                            label={`Giao dịch nhận diện từ ảnh ${String(imageIndex + 1)}`}
                          >
                            <table className="w-full min-w-[1080px] table-fixed text-sm">
                              <caption className="sr-only">
                                Giao dịch nhận diện từ ảnh {String(imageIndex + 1)}
                              </caption>
                              <colgroup>
                                <col className="w-10" />
                                <col className="w-[8.25rem]" />
                                <col className="w-[14rem]" />
                                <col className="w-[7.5rem]" />
                                <col className="w-[8.25rem]" />
                                <col className="w-[11.5rem]" />
                                <col className="w-[10.5rem]" />
                                <col className="w-10" />
                              </colgroup>
                              <thead className="bg-warm-25 text-left text-[11px] font-medium uppercase tracking-wide text-warm-500">
                                <tr className="border-b border-warm-100">
                                  <th scope="col" className="px-2 py-2">
                                    <span className="sr-only">Chọn</span>
                                  </th>
                                  <th scope="col" className="px-2 py-2">Ngày</th>
                                  <th scope="col" className="px-2 py-2">Mô tả</th>
                                  <th scope="col" className="px-2 py-2 text-right">
                                    Số tiền
                                  </th>
                                  <th scope="col" className="px-2 py-2">
                                    {t("direction")}
                                  </th>
                                  <th scope="col" className="px-2 py-2">Danh mục</th>
                                  <th scope="col" className="px-2 py-2">{t("tag")}</th>
                                  <th scope="col" className="px-1 py-2">
                                    <span className="sr-only">Xóa</span>
                                  </th>
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
                                    onUpdate={updateDraft}
                                    onRemove={removeDraft}
                                  />
                                ))}
                              </tbody>
                            </table>
                          </DataTableScrollRegion>
                        ) : (
                          <div className="divide-y divide-warm-100">
                            {groupDrafts.map((row) => (
                              <DraftCardRow
                                key={row.id}
                                row={row}
                                currency={currency}
                                submitting={submitting}
                                canRemove={drafts.length > 1}
                                onUpdate={updateDraft}
                                onRemove={removeDraft}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    ) : null}
                  </section>
                );
              })}
            </div>
          </div>

          {submitError ? (
            <p className="shrink-0 text-sm text-danger md:col-start-1 md:row-start-5" role="alert">
              {submitError}
            </p>
          ) : null}
          </div>

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

const DraftCardRow = memo(function DraftCardRow({
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
  onUpdate: (id: string, patch: Partial<ImageImportDraft>) => void;
  onRemove: (id: string) => void;
}) {
  const t = useTranslations("imageImport");
  const reviewLabel = formatReviewFields(row.reviewFields, t);
  return (
    <div
      className={cn(
        "space-y-3 p-3",
        row.isRefund && "bg-success/5",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <label className="flex min-h-10 items-center gap-2">
          <input
            type="checkbox"
            checked={row.selected}
            disabled={submitting}
            aria-label={t("selectTransaction")}
            className="size-4 rounded border-warm-300 text-accent"
            onChange={(e) => onUpdate(row.id, { selected: e.target.checked })}
          />
          <span className="text-xs font-medium text-warm-500">Chọn</span>
        </label>
        <button
          type="button"
          disabled={submitting || !canRemove}
          className="flex size-10 items-center justify-center rounded-md text-warm-400 hover:bg-warm-100 hover:text-danger disabled:opacity-40"
          aria-label="Xóa dòng"
          onClick={() => onRemove(row.id)}
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {reviewLabel ? (
        <p className="rounded-md bg-warm-100 px-2.5 py-2 text-xs font-medium text-warm-700">
          {t("needsReview", { fields: reviewLabel })}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div className="col-span-2 sm:col-span-1">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-warm-500">
            Ngày
          </span>
          <input
            type="date"
            value={row.txnDate}
            disabled={submitting || !row.selected}
            aria-label={t("date")}
            aria-invalid={row.reviewFields.includes("txnDate")}
            className={cn(
              "h-10 w-full rounded-md border bg-warm-50 px-2 text-sm",
              row.reviewFields.includes("txnDate") ? "border-danger" : "border-warm-200",
            )}
            onChange={(e) => onUpdate(row.id, { txnDate: e.target.value })}
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-warm-500">
            Số tiền
          </span>
          <DraftAmountInput
            value={row.amount}
            currency={currency}
            direction={row.direction}
            isRefund={row.isRefund}
            disabled={submitting || !row.selected}
            ariaLabel={t("amount")}
            invalid={row.reviewFields.includes("amount")}
            onChange={(amount) => onUpdate(row.id, { amount })}
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-warm-500">
            {t("direction")}
          </span>
          <DraftDirectionSelect
            value={row.direction}
            isRefund={row.isRefund}
            disabled={submitting || !row.selected}
            invalid={row.reviewFields.includes("direction")}
            onChange={(direction) => onUpdate(row.id, { direction, categoryId: "" })}
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
            aria-label={t("description")}
            aria-invalid={row.reviewFields.includes("description")}
            className={cn(
              "h-10 min-w-0 flex-1 rounded-md border bg-warm-50 px-2 text-sm",
              row.reviewFields.includes("description") ? "border-danger" : "border-warm-200",
            )}
            onChange={(e) => onUpdate(row.id, { description: e.target.value })}
          />
        </div>
        {row.note ? (
          <p className="mt-1 text-[11px] text-warm-400">{row.note}</p>
        ) : null}
      </div>

      {!row.isRefund ? (
        <div className="space-y-3">
          <div>
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-warm-500">
              Danh mục
            </span>
            <CategorySelector
              kind={row.direction}
              value={row.categoryId || undefined}
              onChange={(id) => onUpdate(row.id, { categoryId: id ?? "" })}
              disabled={submitting || !row.selected}
              placeholder="Danh mục"
              ariaLabel={t("category")}
              className="[&_button]:h-10 [&_button]:w-full [&_button]:text-sm"
            />
          </div>
          <div>
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-warm-500">
              {t("tag")}
            </span>
            <TagPicker
              value={row.tagIds}
              onChange={(tagIds) => onUpdate(row.id, { tagIds })}
              disabled={submitting || !row.selected}
              label={t("tag")}
              compact
            />
          </div>
        </div>
      ) : null}
    </div>
  );
});

const DraftTableRow = memo(function DraftTableRow({
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
  onUpdate: (id: string, patch: Partial<ImageImportDraft>) => void;
  onRemove: (id: string) => void;
}) {
  const t = useTranslations("imageImport");
  const reviewLabel = formatReviewFields(row.reviewFields, t);
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
          aria-label={t("selectTransaction")}
          title={
            row.isRefund
              ? "Hoàn trả — chỉ để tham khảo, không nhập vào sổ"
              : undefined
          }
          className="size-4 rounded border-warm-300 text-accent"
          onChange={(e) => onUpdate(row.id, { selected: e.target.checked })}
        />
      </td>
      <td className="px-2 py-1.5 align-top">
        <input
          type="date"
          value={row.txnDate}
          disabled={submitting || !row.selected}
          aria-label={t("date")}
          aria-invalid={row.reviewFields.includes("txnDate")}
          className={cn(
            "h-9 w-full min-w-[7rem] rounded-md border bg-warm-50 px-2 text-sm",
            row.reviewFields.includes("txnDate") ? "border-danger" : "border-warm-200",
          )}
          onChange={(e) => onUpdate(row.id, { txnDate: e.target.value })}
        />
      </td>
      <td className="min-w-0 overflow-hidden px-2 py-1.5 align-top">
        <div className="flex min-w-0 items-center gap-1.5">
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
            aria-label={t("description")}
            aria-invalid={row.reviewFields.includes("description")}
            className={cn(
              "h-9 min-w-0 flex-1 rounded-md border bg-warm-50 px-2 text-sm",
              row.reviewFields.includes("description") ? "border-danger" : "border-warm-200",
            )}
            onChange={(e) => onUpdate(row.id, { description: e.target.value })}
          />
        </div>
        {row.note ? (
          <p className="mt-1 line-clamp-2 text-[11px] text-warm-400">{row.note}</p>
        ) : null}
        {reviewLabel ? (
          <p className="mt-1 text-[11px] font-medium text-warm-600">
            {t("needsReview", { fields: reviewLabel })}
          </p>
        ) : null}
      </td>
      <td className="min-w-0 px-2 py-1.5 align-top">
        <DraftAmountInput
          value={row.amount}
          currency={currency}
          direction={row.direction}
          isRefund={row.isRefund}
          disabled={submitting || !row.selected}
          ariaLabel={t("amount")}
          invalid={row.reviewFields.includes("amount")}
          onChange={(amount) => onUpdate(row.id, { amount })}
        />
      </td>
      <td className="min-w-0 px-2 py-1.5 align-top">
        <DraftDirectionSelect
          value={row.direction}
          isRefund={row.isRefund}
          disabled={submitting || !row.selected}
          invalid={row.reviewFields.includes("direction")}
          onChange={(direction) => onUpdate(row.id, { direction, categoryId: "" })}
        />
      </td>
      <td className="min-w-0 px-2 py-1.5 align-top">
        {row.isRefund ? (
          <span className="block py-2 text-xs text-warm-400">—</span>
        ) : (
          <CategorySelector
            kind={row.direction}
            value={row.categoryId || undefined}
            onChange={(id) => onUpdate(row.id, { categoryId: id ?? "" })}
            disabled={submitting || !row.selected}
            placeholder="Danh mục"
            ariaLabel={t("category")}
            className="[&_button]:h-9 [&_button]:text-xs"
          />
        )}
      </td>
      <td className="min-w-0 px-2 py-1.5 align-top">
        {row.isRefund ? (
          <span className="block py-2 text-xs text-warm-400">—</span>
        ) : (
          <div>
            <TagPicker
              value={row.tagIds}
              onChange={(tagIds) => onUpdate(row.id, { tagIds })}
              disabled={submitting || !row.selected}
              className="w-full"
              label={t("tag")}
              compact
            />
          </div>
        )}
      </td>
      <td className="px-1 py-1.5 align-top">
        <button
          type="button"
          disabled={submitting || !canRemove}
          className="flex size-9 items-center justify-center rounded-md text-warm-400 hover:bg-warm-100 hover:text-danger disabled:opacity-40"
          aria-label="Xóa dòng"
          onClick={() => onRemove(row.id)}
        >
          <Trash2 className="size-4" />
        </button>
      </td>
    </tr>
  );
});

function DraftDirectionSelect({
  value,
  isRefund,
  disabled,
  invalid,
  onChange,
}: {
  value: ImageImportDraft["direction"];
  isRefund?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  onChange: (direction: ImageImportDraft["direction"]) => void;
}) {
  const t = useTranslations("imageImport");
  if (isRefund) {
    return (
      <span className="flex h-9 items-center text-xs font-semibold text-success">
        {t("refund")}
      </span>
    );
  }
  return (
    <select
      value={value}
      disabled={disabled}
      aria-label={t("direction")}
      aria-invalid={invalid}
      className={cn(
        "h-9 w-full min-w-0 truncate rounded-md border bg-warm-50 px-2 text-sm text-warm-900",
        "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30",
        invalid ? "border-danger" : "border-warm-200",
      )}
      onChange={(event) => onChange(event.target.value as ImageImportDraft["direction"])}
    >
      <option value="expense">{t("expenseDirection")}</option>
      <option value="income">{t("incomeDirection")}</option>
    </select>
  );
}

function DraftAmountInput({
  value,
  currency,
  direction,
  isRefund,
  disabled,
  ariaLabel,
  invalid,
  onChange,
}: {
  value: number;
  currency: string;
  direction: ImageImportDraft["direction"];
  isRefund?: boolean;
  disabled?: boolean;
  ariaLabel: string;
  invalid?: boolean;
  onChange: (amount: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const focusedRef = useRef(false);

  useEffect(() => {
    const el = inputRef.current;
    if (!el || focusedRef.current) return;
    const formatted = formatAmountDisplay(value, currency);
    const sign = isRefund || direction === "income" ? "+ " : "- ";
    el.value = formatted ? `${sign}${formatted}` : "";
  }, [value, currency, direction, isRefund]);

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode={currency === "VND" ? "numeric" : "decimal"}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-invalid={invalid}
      className={cn(
        "h-9 w-full min-w-[5.5rem] rounded-md border bg-warm-50 px-2 text-right font-mono text-sm",
        invalid
          ? "border-danger text-warm-900"
          : isRefund || direction === "income"
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
        const sign = isRefund || direction === "income" ? "+ " : "- ";
        e.currentTarget.value = formatted ? `${sign}${formatted}` : "";
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
