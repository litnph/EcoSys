import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import { useMemo } from "react";

import { cn } from "@/shared/lib/utils";

import { useFlatCategories } from "@/features/categories/hooks/useFlatCategories";
import type { CategoryKind } from "@/features/categories/types";

const NONE = "__parent_category_none__";

export interface ParentCategorySelectorProps {
  value: string | undefined;
  onChange: (categoryId: string | undefined) => void;
  kind: CategoryKind;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ParentCategorySelector({
  value,
  onChange,
  kind,
  placeholder = "Tất cả danh mục cha",
  disabled,
  className,
}: ParentCategorySelectorProps) {
  const { data, isLoading } = useFlatCategories(kind);

  const roots = useMemo(
    () => (data ?? []).filter((row) => row.depth === 0),
    [data],
  );

  const selectedLabel =
    value != null ? roots.find((r) => r.id === value)?.name : undefined;

  return (
    <SelectPrimitive.Root
      value={value ?? NONE}
      onValueChange={(v) => onChange(v === NONE ? undefined : v)}
      disabled={disabled || isLoading}
    >
      <SelectPrimitive.Trigger
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-input border border-warm-200 bg-warm-50 px-3 text-left text-sm text-warm-900",
          "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60",
          className,
        )}
      >
        <span className="min-w-0 truncate">
          {selectedLabel ?? (
            <span className="text-warm-400">{placeholder}</span>
          )}
        </span>
        <ChevronDown className="size-4 shrink-0 text-warm-500" />
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          sideOffset={4}
          position="popper"
          className="z-[120] max-h-[280px] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-button border border-warm-200 bg-surface shadow-lg"
        >
          <SelectPrimitive.Viewport className="max-h-[260px] overflow-y-auto p-1">
            <SelectPrimitive.Item
              value={NONE}
              className="relative cursor-pointer rounded-md px-3 py-2 text-sm outline-none data-[highlighted]:bg-warm-100"
            >
              <SelectPrimitive.ItemText>{placeholder}</SelectPrimitive.ItemText>
            </SelectPrimitive.Item>
            {roots.map((row) => (
              <SelectPrimitive.Item
                key={row.id}
                value={row.id}
                className="relative cursor-pointer rounded-md px-3 py-2 text-sm outline-none data-[highlighted]:bg-warm-100 data-[state=checked]:bg-accent/10"
              >
                <SelectPrimitive.ItemText>{row.name}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
