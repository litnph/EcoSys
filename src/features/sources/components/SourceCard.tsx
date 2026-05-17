"use client";

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
import { sourceTypeLabelVi } from "../utils/sourceLabels";

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

function utilizationTone(usedPct: number | null): string {
  if (usedPct === null) return "bg-accent";
  if (usedPct > 90) return "bg-danger";
  if (usedPct > 70) return "bg-warning";
  return "bg-success";
}

function creditUsedPct(source: FinSource): number | null {
  if (source.type !== "creditCard") return null;
  const limit = source.creditLimit;
  if (limit == null || limit <= 0) return null;
  return Math.min(100, Math.round((source.balance / limit) * 1000) / 10);
}

export type SourceCardProps = {
  source: FinSource;
  onEdit: (source: FinSource) => void;
  onDelete: (source: FinSource) => void;
};

function SourceCardInner({ source, onEdit, onDelete }: SourceCardProps) {
  const TypeIcon = sourceTypeIcon(source.type);
  const usedPct = creditUsedPct(source);
  const isCard = source.type === "creditCard";
  const iconChar = source.icon?.trim();

  const balanceLabel = React.useMemo(
    () => formatCurrency(source.balance, source.currency),
    [source.balance, source.currency],
  );

  const handleEdit = React.useCallback(() => {
    onEdit(source);
  }, [onEdit, source]);

  const handleDelete = React.useCallback(() => {
    onDelete(source);
  }, [onDelete, source]);

  return (
    <motion.article
      layout
      {...cardHoverMotion}
      className={cn(
        "group flex h-full flex-col rounded-card border border-warm-200 p-5 shadow-sm",
        "transition-shadow duration-200 hover:shadow-md",
      )}
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
                "focus-visible:ring-2 focus-visible:ring-accent",
              )}
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
                "z-[120] min-w-[160px] rounded-card border border-warm-200 bg-surface p-1 shadow-lg outline-none",
              )}
            >
              <DropdownMenu.Item
                className={cn(
                  "cursor-pointer select-none rounded-md px-2 py-2 text-sm text-warm-800 outline-none",
                  "hover:bg-warm-100 focus:bg-warm-100",
                )}
                onSelect={handleEdit}
              >
                Sửa
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className={cn(
                  "cursor-pointer select-none rounded-md px-2 py-2 text-sm text-danger outline-none",
                  "hover:bg-warm-100 focus:bg-warm-100",
                )}
                onSelect={handleDelete}
              >
                Xóa
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      <p className="mt-4 font-mono text-xl font-semibold tabular-nums text-warm-900">
        {balanceLabel}
      </p>

      {isCard && source.creditLimit != null && source.creditLimit > 0 ? (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs text-warm-500">
            <span>Đã dùng</span>
            <span className="font-mono text-warm-700">
              {usedPct !== null ? `${String(usedPct)}%` : "—"}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-warm-100/90">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                utilizationTone(usedPct),
              )}
              style={{
                width: `${String(Math.min(100, usedPct ?? 0))}%`,
              }}
            />
          </div>
          {source.statementDay != null ? (
            <p className="text-xs text-warm-500">
              Sao kê ngày{" "}
              <span className="font-mono font-medium text-warm-700">
                {source.statementDay}
              </span>
            </p>
          ) : null}
        </div>
      ) : null}
    </motion.article>
  );
}

export const SourceCard = React.memo(SourceCardInner);
