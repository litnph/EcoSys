import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { motion } from "framer-motion";
import { MoreVertical } from "lucide-react";
import * as React from "react";

import { sourceTypeIcon } from "@/features/dashboard/utils/financeDisplay";
import { Badge } from "@/shared/components/ui/Badge";
import { formatCurrency } from "@/shared/lib/formatters";
import { cardHoverMotion } from "@/shared/lib/animations";
import { cn } from "@/shared/lib/utils";

import type { FinSource } from "../types";
import { supportsBalanceLedger } from "../utils/assetSource";
import {
  assetAvailableBalance,
  creditSourceBreakdown,
} from "../utils/creditSourceBreakdown";
import { sourceTypeLabelVi } from "../utils/sourceLabels";

import { CreditLimitBar, CreditLimitLegend } from "./CreditLimitBar";

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.trim().replace("#", "");
  if (h.length !== 6 || alpha < 0 || alpha > 1) {
    return `rgba(0,0,0,${String(alpha)})`;
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${String(r)},${String(g)},${String(b)},${String(alpha)})`;
}

function cardTintColor(source: FinSource): string {
  if (source.color && /^#[0-9a-fA-F]{6}$/.test(source.color)) {
    return hexToRgba(source.color, 0.1);
  }
  return "rgba(0,0,0,0.03)";
}

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
    <motion.article
      layout
      {...cardHoverMotion}
      className={cn(
        "group flex h-full flex-col rounded-card border border-warm-200 p-5 shadow-sm",
        "transition-shadow duration-200 hover:shadow-md")}
      style={{ backgroundColor: cardTintColor(source) }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface text-2xl shadow-sm ring-1 ring-warm-200/80"
            aria-hidden
          >
            {iconChar && iconChar.length > 0 ? (
              <span className="leading-none">{iconChar}</span>
            ) : (
              <TypeIcon className="size-6 text-warm-600" />
            )}
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-display text-base font-semibold text-warm-900">
              {source.name}
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
        <div className="mt-4 space-y-3">
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
        <div className="mt-4 space-y-1">
          <p className="text-xs font-medium text-warm-500">Dư nợ</p>
          <p className="font-mono text-xl font-semibold tabular-nums text-warm-900">
            {formatCurrency(Math.max(0, source.balance), source.currency)}
          </p>
          {(source.installmentRemainingAmount ?? 0) > 0 ? (
            <p className="text-xs text-amber-800">
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
        <div className="mt-4">
          <p className="text-xs font-medium text-warm-500">Số dư khả dụng</p>
          <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-success">
            {formatCurrency(availableBalance, source.currency)}
          </p>
        </div>
      )}
    </motion.article>
  );
}

export const SourceCard = React.memo(SourceCardInner);
