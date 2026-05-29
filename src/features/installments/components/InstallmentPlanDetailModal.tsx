import { Link } from "@/i18n/navigation";
import { ExternalLink } from "lucide-react";

import { ROUTES } from "@/config/routes";
import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";
import { formatCurrency, formatDate } from "@/shared/lib/formatters";

import { useInstallmentPlanDetail } from "../hooks/useInstallmentPlanDetail";
import type { InstallmentPay, InstallmentPlanListItem } from "../types";
import { InstallmentPaysTable } from "./InstallmentPaysTable";

function planTitle(
  listItem: InstallmentPlanListItem | null,
  categoryName?: string | null,
): string {
  return (
    categoryName?.trim() ||
    listItem?.originalTxnCategoryName?.trim() ||
    listItem?.originalTxnDescription?.trim() ||
    "Kế hoạch trả góp"
  );
}

export interface InstallmentPlanDetailModalProps {
  planId: string | null;
  listItem: InstallmentPlanListItem | null;
  currency: string;
  isOpen: boolean;
  onClose: () => void;
  onPay: (planId: string, pay: InstallmentPay) => void;
  onDelete?: () => void;
  onCancel?: () => void;
}

export function InstallmentPlanDetailModal({
  planId,
  listItem,
  currency,
  isOpen,
  onClose,
  onPay,
  onDelete,
  onCancel,
}: InstallmentPlanDetailModalProps) {
  const detailQ = useInstallmentPlanDetail(planId, isOpen);
  const plan = detailQ.data;
  const canDelete = listItem?.canDelete ?? plan?.canDelete ?? false;
  const title = planTitle(listItem, plan?.originalTxnCategoryName);
  const remainingAmount =
    listItem?.remainingAmount ??
    (plan
      ? plan.pays
          .filter((p) => p.status !== "paid")
          .reduce((sum, p) => sum + (p.amount - p.paidAmount), 0)
      : 0);
  const planStatus = listItem?.status ?? plan?.status;
  const sourceName = listItem?.sourceName ?? plan?.sourceName;
  const paidInstallments =
    listItem?.paidInstallments ??
    plan?.pays.filter((p) => p.status === "paid").length ??
    0;
  const totalInstallments =
    listItem?.totalInstallments ?? plan?.totalMonths ?? 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={
        sourceName
          ? `${sourceName} · ${String(paidInstallments)}/${String(totalInstallments)} kỳ`
          : undefined
      }
      size="lg"
    >
      {detailQ.isLoading ? (
        <p className="py-6 text-center text-sm text-warm-500">Đang tải…</p>
      ) : detailQ.isError || !plan ? (
        <p className="py-6 text-center text-sm text-danger">
          Không tải được chi tiết kế hoạch.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-lg border border-warm-200 bg-warm-50/60 px-3 py-2 text-xs text-warm-700">
            <span>
              Tổng{" "}
              <strong className="font-mono tabular-nums text-warm-900">
                {formatCurrency(plan.totalAmount, currency)}
              </strong>
            </span>
            <span className="text-warm-300">|</span>
            <span>
              Mỗi kỳ{" "}
              <strong className="font-mono tabular-nums text-warm-900">
                {formatCurrency(plan.monthlyAmount, currency)}
              </strong>
            </span>
            <span className="text-warm-300">|</span>
            <span>
              Còn lại{" "}
              <strong className="font-mono tabular-nums text-accent">
                {formatCurrency(remainingAmount, currency)}
              </strong>
            </span>
            <span className="text-warm-300">|</span>
            <span>
              Bắt đầu <strong>{formatDate(plan.startDate)}</strong>
            </span>
            {plan.interestRate > 0 ? (
              <>
                <span className="text-warm-300">|</span>
                <span>
                  Lãi <strong>{String(plan.interestRate)}%</strong>
                </span>
              </>
            ) : null}
            {plan.conversionFeeAmount != null && plan.conversionFeeAmount > 0 ? (
              <>
                <span className="text-warm-300">|</span>
                <span>
                  Phí CTĐ{" "}
                  <strong className="font-mono tabular-nums">
                    {formatCurrency(plan.conversionFeeAmount, currency)}
                  </strong>
                </span>
              </>
            ) : null}
          </div>

          <InstallmentPaysTable
            pays={plan.pays}
            currency={currency}
            onPay={
              planStatus === "active"
                ? (pay) => onPay(plan.id, pay)
                : undefined
            }
          />

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-warm-100 pt-3">
            <Link
              href={`${ROUTES.dashboard.transactions}?highlight=${encodeURIComponent(plan.originalTxnId)}`}
              className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
            >
              Giao dịch gốc
              <ExternalLink className="size-3" aria-hidden />
            </Link>
            <div className="flex flex-wrap gap-2">
              {canDelete && onDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-danger"
                  onClick={onDelete}
                >
                  Xóa kế hoạch
                </Button>
              ) : null}
              {planStatus === "active" && onCancel ? (
                <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
                  Hủy kế hoạch
                </Button>
              ) : null}
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
