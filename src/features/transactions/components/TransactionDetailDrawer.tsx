import * as Tabs from "@radix-ui/react-tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  FileText,
  History as HistoryIcon,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";
import { useTranslations } from "@/i18n/hooks";
import * as React from "react";

import { Drawer } from "@/shared/components/ui/Drawer";
import { Button } from "@/shared/components/ui/Button";
import { SkeletonText } from "@/shared/components/ui/Skeleton";
import { useIsMdUp } from "@/shared/hooks/useMediaQuery";
import { formatCurrency, formatDate } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";

import { deleteFile, getFileUrl, uploadFile } from "@/features/files";
import { useToastStore } from "@/shared/stores/toastStore";

import { getTransactionAttachments, getTransactionById } from "../api/transactionsApi";
import { transactionKeys } from "../api/transactionKeys";
import { useDeleteTransaction } from "../hooks/useDeleteTransaction";
import type { Transaction } from "../types";
import {
  isInstallmentRelatedTxn,
  transactionTypeLabel,
  txnAmountPresentation,
} from "../utils/txnDisplay";

import { DeleteTransactionModal } from "./DeleteTransactionModal";
import { TransactionEditModal } from "./TransactionEditModal";
import { TransactionHistoryTimeline } from "./TransactionHistoryTimeline";

export interface TransactionDetailDrawerProps {
  transactionId: string | null;
  isOpen: boolean;
  onClose: () => void;
  listPreview?: Transaction | null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function kindBadgeLabel(
  kind: string | undefined,
  tFilters: (key: "categoryKindIncome" | "categoryKindTransfer" | "categoryKindExpense") => string): string {
  if (!kind) return "";
  const k = kind.toLowerCase();
  if (k.includes("income")) return tFilters("categoryKindIncome");
  if (k.includes("transfer")) return tFilters("categoryKindTransfer");
  return tFilters("categoryKindExpense");
}

const tabListClass =
  "flex gap-1 rounded-button border border-warm-200 bg-warm-50 p-1 text-sm";

const tabTriggerClass = cn(
  "flex-1 rounded-md px-3 py-2 font-medium transition outline-none",
  "data-[state=active]:bg-surface data-[state=active]:text-warm-900 data-[state=active]:shadow-sm",
  "data-[state=inactive]:text-warm-500 hover:text-warm-800");

function DetailDrawerSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <SkeletonText className="h-6 w-32 rounded-badge" />
      <SkeletonText className="h-12 w-56 max-w-full" />
      <div className="space-y-3 rounded-lg border border-warm-100 bg-warm-25/50 p-4">
        <SkeletonText className="h-4 w-2/5" />
        <SkeletonText className="h-24 w-full rounded-card" />
      </div>
      <SkeletonText className="h-10 w-full rounded-input" />
    </div>
  );
}

export function TransactionDetailDrawer({
  transactionId,
  isOpen,
  onClose,
  listPreview,
}: TransactionDetailDrawerProps) {
  const t = useTranslations("transaction");
  const tFilters = useTranslations("filters");
  const tCommon = useTranslations("common");
  const isMdUp = useIsMdUp();
  const del = useDeleteTransaction();
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [detailTab, setDetailTab] = React.useState("attachments");
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      if (!transactionId) throw new Error("Missing transaction");
      return uploadFile({
        entityType: "FinTransaction",
        entityId: transactionId,
        file,
      });
    },
    onSuccess: () => {
      if (transactionId) {
        void queryClient.invalidateQueries({
          queryKey: transactionKeys.attachments(transactionId),
        });
      }
      addToast({ type: "success", title: "Đã tải file lên" });
    },
    onError: () => {
      addToast({ type: "error", title: "Không tải file lên được" });
    },
  });

  React.useEffect(() => {
    if (!isOpen) {
      setDetailTab("attachments");
      setDeleteOpen(false);
      setEditOpen(false);
    }
  }, [isOpen]);

  const detailQ = useQuery({
    queryKey: transactionId
      ? transactionKeys.detail(transactionId)
      : ["transactions", "detail", "__"],
    queryFn: () => getTransactionById(transactionId!),
    enabled: Boolean(isOpen && transactionId),
  });

  const attachQ = useQuery({
    queryKey: transactionId
      ? transactionKeys.attachments(transactionId)
      : ["transactions", "attachments", "__"],
    queryFn: () => getTransactionAttachments(transactionId!),
    enabled: Boolean(isOpen && transactionId),
  });

  const tx = detailQ.data;
  const mergedDisplay = tx ?? listPreview;
  const detail = tx;

  const historyEnabled =
    isOpen &&
    Boolean(transactionId) &&
    detailTab === "history";

  const title =
    mergedDisplay != null
      ? detail?.category?.name ??
          mergedDisplay.categoryName ??
          transactionTypeLabel(mergedDisplay.type, t)
      : t("detailFallbackTitle");

  const amountPres = mergedDisplay
    ? txnAmountPresentation(mergedDisplay.type, mergedDisplay.amount, {
        hasInstallmentPlan: mergedDisplay.hasInstallmentPlan,
        isInstallmentPayment: mergedDisplay.isInstallmentPayment,
      })
    : { sign: "", className: "" };

  const installmentRelated =
    mergedDisplay != null && isInstallmentRelatedTxn(mergedDisplay);

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        description={
          mergedDisplay
            ? formatDate(mergedDisplay.txnDate)
            : t("detailLoadingDesc")
        }
        side={isMdUp ? "right" : "bottom"}
        size="lg"
      >
        {detailQ.isError ? (
          <p className="text-sm text-danger">{t("detailLoadError")}</p>
        ) : detailQ.isLoading && !listPreview ? (
          <DetailDrawerSkeleton />
        ) : mergedDisplay ? (
          <div className="space-y-6">
            {mergedDisplay.hasInstallmentPlan ? (
              <div
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950"
                role="status"
              >
                <p className="font-medium">Đã chuyển sang trả góp</p>
                <p className="mt-0.5 text-xs text-amber-800/90">
                  Giao dịch gốc này đang được theo dõi qua kế hoạch trả góp trên
                  thẻ tín dụng — không phải đã hoàn tất toàn bộ kế hoạch.
                </p>
              </div>
            ) : null}
            {mergedDisplay.isInstallmentPayment ? (
              <div
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950"
                role="status"
              >
                <p className="font-medium">Thanh toán kỳ trả góp</p>
                <p className="mt-0.5 text-xs text-amber-800/90">
                  Giao dịch ghi nhận thanh toán một kỳ trong kế hoạch trả góp.
                </p>
              </div>
            ) : null}

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-badge border border-warm-200 bg-warm-50 px-2 py-0.5 text-xs font-medium text-warm-700">
                  {transactionTypeLabel(mergedDisplay.type, t)}
                </span>
                {installmentRelated ? (
                  <span className="inline-flex rounded-badge bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-200">
                    Trả góp
                  </span>
                ) : null}
              </div>
              <p
                className={cn(
                  "mt-3 font-mono text-3xl font-bold tabular-nums",
                  amountPres.className)}
              >
                {amountPres.sign}
                {formatCurrency(
                  Math.abs(mergedDisplay.amount),
                  mergedDisplay.currency)}
              </p>
            </div>

            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-warm-500">{t("sourceLabel")}</dt>
                <dd className="font-medium text-warm-900">
                  {detail?.source?.name ?? mergedDisplay.sourceName ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-warm-500">{t("categoryLabel")}</dt>
                <dd className="font-medium text-warm-900">
                  {detail?.category ? (
                    <span className="inline-flex flex-wrap items-center gap-2">
                      {detail.category.name}
                      <span className="rounded-md bg-warm-100 px-1.5 py-0.5 text-xs text-warm-600">
                        {kindBadgeLabel(detail.category.kind, tFilters)}
                      </span>
                    </span>
                  ) : mergedDisplay.categoryName ? (
                    mergedDisplay.categoryName
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-warm-500">{t("noteDescription")}</dt>
                <dd className="text-warm-900">
                  {(mergedDisplay.note?.trim() ||
                    mergedDisplay.description?.trim() ||
                    "—") as string}
                </dd>
              </div>
              {mergedDisplay.refTxnId || detail?.refTxnId ? (
                <div>
                  <dt className="text-warm-500">{t("refTxn")}</dt>
                  <dd className="break-all font-mono text-xs text-warm-800">
                    {detail?.refTxnId ?? mergedDisplay.refTxnId}
                  </dd>
                </div>
              ) : null}
              {typeof (detail?.version ?? mergedDisplay.version) === "number" ? (
                <div>
                  <dt className="text-warm-500">{t("version")}</dt>
                  <dd className="font-mono text-warm-900">
                    {detail?.version ?? mergedDisplay.version}
                  </dd>
                </div>
              ) : null}
            </dl>

            <Tabs.Root
              value={detailTab}
              onValueChange={setDetailTab}
            >
              <Tabs.List className={tabListClass}>
                <Tabs.Trigger className={tabTriggerClass} value="attachments">
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="size-4" />
                    {t("attachments")}
                  </span>
                </Tabs.Trigger>
                <Tabs.Trigger className={tabTriggerClass} value="history">
                  <span className="inline-flex items-center gap-1.5">
                    <HistoryIcon className="size-4" />
                    {t("historyTab")}
                  </span>
                </Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="attachments" className="mt-4 outline-none">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadMutation.mutate(file);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    leftIcon={<Upload className="size-4" />}
                    disabled={!transactionId || uploadMutation.isPending}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {t("uploadAttachment")}
                  </Button>
                </div>
                {attachQ.isLoading ? (
                  <div className="space-y-2" aria-busy="true">
                    <SkeletonText className="h-14 w-full rounded-lg" />
                    <SkeletonText className="h-14 w-full rounded-lg" />
                  </div>
                ) : attachQ.data && attachQ.data.length > 0 ? (
                  <ul className="space-y-2">
                    {attachQ.data.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-start justify-between gap-2 rounded-lg border border-warm-100 bg-warm-25 px-3 py-2 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-warm-900">{a.fileName}</p>
                          <p className="text-xs text-warm-500">
                            {a.mimeType} · {formatFileSize(a.fileSize)}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            className="rounded p-1.5 text-warm-600 hover:bg-warm-100"
                            aria-label={t("downloadAttachment")}
                            onClick={() => {
                              void getFileUrl(a.id).then(({ url }) => {
                                window.open(url, "_blank", "noopener,noreferrer");
                              });
                            }}
                          >
                            <Download className="size-4" />
                          </button>
                          <button
                            type="button"
                            className="rounded p-1.5 text-warm-500 hover:bg-warm-100 hover:text-danger"
                            aria-label={tCommon("delete")}
                            onClick={() => {
                              void deleteFile(a.id).then(() => {
                                if (transactionId) {
                                  void queryClient.invalidateQueries({
                                    queryKey: transactionKeys.attachments(transactionId),
                                  });
                                }
                                addToast({ type: "success", title: "Đã xóa file" });
                              });
                            }}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-warm-500">{t("noAttachments")}</p>
                )}
              </Tabs.Content>
              <Tabs.Content value="history" className="mt-4 outline-none">
                <TransactionHistoryTimeline
                  transactionId={transactionId}
                  enabled={historyEnabled}
                />
              </Tabs.Content>
            </Tabs.Root>

            <div className="flex flex-wrap gap-2 border-t border-warm-100 pt-4">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<Pencil className="size-4" />}
                disabled={!detail}
                onClick={() => setEditOpen(true)}
              >
                {tCommon("edit")}
              </Button>
              {detail?.canDelete !== false && detail?.type !== "reversal" ? (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={del.isPending}
                  leftIcon={<Trash2 className="size-4" />}
                  onClick={() => setDeleteOpen(true)}
                >
                  {tCommon("delete")}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Drawer>

      {detail ? (
        <TransactionEditModal
          transaction={detail}
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
        />
      ) : null}

      <DeleteTransactionModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        transactionId={transactionId}
        expectedVersion={detail?.version ?? listPreview?.version}
        
        mutation={del}
        onDeleted={() => {
          onClose();
        }}
      />
    </>
  );
}
