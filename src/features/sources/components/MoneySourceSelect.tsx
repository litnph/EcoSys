import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type { FinSource } from "../types";

const NONE = "__money_source_none__";

export interface MoneySourceSelectProps {
  id?: string;
  sources: FinSource[];
  value: string;
  onChange: (sourceId: string) => void;
  label?: string;
  placeholder?: string;
  emptyLabel?: string;
  allowEmpty?: boolean;
  disabled?: boolean;
  className?: string;
}

export function MoneySourceSelect({
  id,
  sources,
  value,
  onChange,
  label,
  placeholder = "Chọn nguồn tiền",
  emptyLabel = "Không gán nguồn tiền",
  allowEmpty = true,
  disabled,
  className,
}: MoneySourceSelectProps) {
  return (
    <div className={className}>
      {label ? (
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-warm-700">
          {label}
        </label>
      ) : null}
      <SelectPrimitive.Root
        value={value || NONE}
        onValueChange={(next) => onChange(next === NONE ? "" : next)}
        disabled={disabled || (!allowEmpty && sources.length === 0)}
      >
        <SelectPrimitive.Trigger
          id={id}
          aria-label={label ?? placeholder}
          className={cn(
            "flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-button border border-warm-200",
            "bg-warm-50 px-3 text-left text-sm text-warm-900",
            "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          <span className="min-w-0 flex-1 truncate">
            <SelectPrimitive.Value placeholder={placeholder} />
          </span>
          <SelectPrimitive.Icon>
            <ChevronDown className="size-4 shrink-0 text-warm-500" aria-hidden />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={4}
            className="z-[200] max-h-[min(20rem,var(--radix-select-content-available-height))] overflow-hidden rounded-button border border-warm-200 bg-surface elevation-menu"
          >
            <SelectPrimitive.Viewport className="max-h-72 overflow-y-auto p-1">
              {allowEmpty ? (
                <SelectPrimitive.Item
                  value={NONE}
                  className="cursor-pointer rounded-md px-3 py-2 text-sm text-warm-500 outline-none data-[highlighted]:bg-warm-100"
                >
                  <SelectPrimitive.ItemText>{emptyLabel}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ) : null}
              {sources.map((source) => (
                <SelectPrimitive.Item
                  key={source.id}
                  value={source.id}
                  className="cursor-pointer rounded-md px-3 py-2 text-sm outline-none data-[highlighted]:bg-warm-100"
                >
                  <SelectPrimitive.ItemText>{source.name}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  );
}
