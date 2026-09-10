import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreVertical } from "lucide-react";
import * as React from "react";

import { sourceTypeIcon } from "@/features/dashboard/utils/financeDisplay";
import { Badge } from "@/shared/components/ui/Badge";
import { formatCurrency } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";

import type { FinSource } from "../types";
import { supportsBalanceLedger } from "../utils/assetSource";
import {
  assetAvailableBalance,
  creditSourceBreakdown,
} from "../utils/creditSourceBreakdown";
import { sourceTypeLabelVi } from "../utils/sourceLabels";

import { CreditLimitBar, CreditLimitLegend } from "./CreditLimitBar";

export type SourceCardProps = {
  source: FinSource;
  onEdit: (source: FinSource) => void;
  onDelete: (source: FinSource) => void;
  onViewLedger?: (source: FinSource) => void;
};

function SourceCardInner({ source, onEdit, onDelete, onViewLedger }: SourceCardProps) {
  const TypeIcon = sourceTypeIcon(source.type);
  const isCard = source.type === "creditCard";
  const iconChar = source.icon?.trim();
  const creditBreakdown = React.useMemo(
    () => creditSourceBreakdown(source),
    [source]);

  const availableBalance = React.useMemo(
    () => assetAvailableBalance(source),
    [source]);

  const handleEdit = React.useCallback(() => {
    onEdit(source);
  }, [onEdit, source]);

  const handleDelete = React.useCallback(() => {
    onDelete(source);
  }, [onDelete, source]);

  const handleLedger = React.useCallback(() => {
    onViewLedger?.(source);
  }, [onViewLedger, source]);

  const showLedger =
    supportsBalanceLedger(source.type) && typeof onViewLedger === "function";

  return (
    <article
      className={cn(
        "group grid min-h-28 gap-4 bg-surface p-4 transition-colors duration-150 hover:bg-warm-25",
        "md:grid-cols-[minmax(14rem,0.9fr)_minmax(18rem,1.1fr)] md:items-center")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-button bg-warm-50 text-xl text-warm-700 ring-1 ring-warm-200"
            aria-hidden
          >
            {iconChar && iconChar.length > 0 ? (
              <span className="leading-none">{iconChar}</span>
            ) : (
              <TypeIcon className="size-5" />
            )}
          </span>
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 truncate font-display text-base font-semibold text-warm-900">
              {source.color ? <span className="size-2 shrink-0 rounded-sm" style={{ backgroundColor: source.color }} aria-hidden /> : null}
              <span className="truncate">{source.name}</span>
            </h3>
            <Badge size="sm" className="mt-1.5">
              {sourceTypeLabelVi(source.type)}
            </Badge>
          </div>
        </div>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className={cn(
                "rounded-button p-1.5 text-warm-500 outline-none",
                "hover:bg-warm-100/80 hover:text-warm-900",
                "focus-visible:ring-2 focus-visible:ring-accent")}
              aria-label="Thao tác"
            >
              <MoreVertical className="size-5" aria-hidden />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={6}
              className={cn(
                "z-[120] min-w-[160px] rounded-card border border-warm-200 bg-surface p-1 shadow-lg outline-none")}
            >
              {showLedger ? (
                <DropdownMenu.Item
                  className={cn(
                    "cursor-pointer select-none rounded-md px-2 py-2 text-sm text-warm-800 outline-none",
                    "hover:bg-warm-100 focus:bg-warm-100")}
                  onSelect={handleLedger}
                >
                  Sổ số dư
                </DropdownMenu.Item>
              ) : null}
              <DropdownMenu.Item
                className={cn(
                  "cursor-pointer select-none rounded-md px-2 py-2 text-sm text-warm-800 outline-none",
                  "hover:bg-warm-100 focus:bg-warm-100")}
                onSelect={handleEdit}
              >
                Sửa
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className={cn(
                  "cursor-pointer select-none rounded-md px-2 py-2 text-sm text-danger outline-none",
                  "hover:bg-warm-100 focus:bg-warm-100")}
                onSelect={handleDelete}
              >
                Xóa
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {isCard && creditBreakdown ? (
        <div className="space-y-3 md:border-l md:border-warm-200 md:pl-4">
          <CreditLimitLegend
            spentLabel="Đã dùng"
            spentValue={formatCurrency(
              creditBreakdown.spentAmount,
              source.currency)}
            installmentLabel="Trả góp"
            installmentValue={formatCurrency(
              creditBreakdown.installmentAmount,
              source.currency)}
            availableLabel="Khả dụng"
            availableValue={formatCurrency(
              creditBreakdown.availableAmount,
              source.currency)}
          />
          <CreditLimitBar
            spentPct={creditBreakdown.bar.spentPct}
            installmentPct={creditBreakdown.bar.installmentPct}
            availablePct={creditBreakdown.bar.availablePct}
          />
          {source.statementDay != null ? (
            <p className="text-xs text-warm-500">
              Sao kê ngày{" "}
              <span className="font-mono font-medium text-warm-700">
                {source.statementDay}
              </span>
            </p>
          ) : null}
        </div>
      ) : isCard ? (
        <div className="space-y-1 md:border-l md:border-warm-200 md:pl-4">
          <p className="text-xs font-medium text-warm-500">Dư nợ</p>
          <p className="font-mono text-xl font-semibold tabular-nums text-warm-900">
            {formatCurrency(Math.max(0, source.balance), source.currency)}
          </p>
          {(source.installmentRemainingAmount ?? 0) > 0 ? (
            <p className="text-xs text-warm-700">
              Trả góp còn lại:{" "}
              <span className="font-mono font-medium">
                {formatCurrency(
                  source.installmentRemainingAmount ?? 0,
                  source.currency)}
              </span>
            </p>
          ) : null}
        </div>
      ) : (
        <div className="md:border-l md:border-warm-200 md:pl-4">
          <p className="text-xs font-medium text-warm-500">Số dư khả dụng</p>
          <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-success">
            {formatCurrency(availableBalance, source.currency)}
          </p>
        </div>
      )}
    </article>
  );
}

export const SourceCard = React.memo(SourceCardInner);
