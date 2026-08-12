import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/shared/lib/utils";

import { useCategories } from "../hooks/useCategories";
import type { CategoryKind, FinCategory } from "../types";

const NONE = "__category_none__";

function flattenLabels(roots: FinCategory[]): Map<string, FinCategory> {
  const m = new Map<string, FinCategory>();
  function walk(n: FinCategory) {
    m.set(n.id, n);
    n.children?.forEach(walk);
  }
  roots.forEach(walk);
  return m;
}

function matchesNorm(qNorm: string, name: string) {
  if (!qNorm) return true;
  return name.toLowerCase().includes(qNorm);
}

/** Giữ nhóm nếu khớp cha hoặc còn con khớp (search trong dropdown). */
function filterRoots(roots: FinCategory[], qRaw: string): FinCategory[] {
  const qNorm = qRaw.trim().toLowerCase();
  if (!qNorm) return roots;
  const out: FinCategory[] = [];
  for (const r of roots) {
    const kids = r.children ?? [];
    const parentHit = matchesNorm(qNorm, r.name);
    const filteredKids = kids.filter((c) => matchesNorm(qNorm, c.name));
    if (parentHit) {
      out.push({ ...r, children: kids.length ? [...kids] : undefined });
    } else if (filteredKids.length) {
      out.push({ ...r, children: filteredKids });
    }
  }
  return out;
}

export interface CategorySelectorProps {
  value: string | undefined;
  onChange: (categoryId: string | undefined) => void;
  kind: CategoryKind;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

function OptionLabel({ cat }: { cat: FinCategory }) {
  const emoji = cat.icon?.trim() ?? "";
  return (
    <span className="flex min-w-0 items-center gap-2">
      {emoji ? (
        <span className="shrink-0 text-base leading-none" aria-hidden>
          {emoji}
        </span>
      ) : null}
      <span className="truncate">{cat.name}</span>
    </span>
  );
}

const itemClass =
  "relative flex cursor-pointer select-none items-center rounded-md px-2 py-2 text-sm outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-warm-100 data-[state=checked]:bg-accent/15";

export function CategorySelector({
  value,
  onChange,
  kind,
  placeholder = "Chọn danh mục",
  error,
  disabled,
  className,
}: CategorySelectorProps) {
  const { data, isPending, isError } = useCategories(kind);
  const roots = useMemo(
    () => (data ?? []).filter((row) => row.kind === kind),
    [data, kind],
  );
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredRoots = useMemo(
    () => filterRoots(roots, open ? search : ""),
    [roots, search, open]);

  const byId = useMemo(() => flattenLabels(roots), [roots]);

  const selected = value ? byId.get(value) : undefined;

  const selectValue = value ?? NONE;

  const disableControl =
    disabled || isPending || isError || false;

  return (
    <div className={cn("w-full", className)}>
      <SelectPrimitive.Root
        key={kind}
        value={selectValue}
        onValueChange={(v) => {
          onChange(v === NONE ? undefined : v);
        }}
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setSearch("");
        }}
        disabled={disableControl}
      >
        <SelectPrimitive.Trigger
          aria-label="Danh mục"
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-button border bg-warm-50 px-3 text-left text-sm text-warm-900 transition-colors",
            "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30",
            "disabled:cursor-not-allowed disabled:opacity-60",
            error
              ? "border-danger focus:border-danger focus:ring-danger/30"
              : "border-warm-200")}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "category-selector-error" : undefined}
        >
          <span className="min-w-0 flex-1 truncate">
            {selected ? (
              <OptionLabel cat={selected} />
            ) : (
              <span className="text-warm-400">{placeholder}</span>
            )}
          </span>
          <SelectPrimitive.Icon>
            <ChevronDown className="h-4 w-4 shrink-0 text-warm-600" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            className={cn(
              "z-[120] max-h-[min(360px,var(--radix-select-content-available-height))] overflow-hidden rounded-button border border-warm-200 bg-warm-50 shadow-lg")}
            sideOffset={4}
          >
            <div
              className="border-b border-warm-200 p-2"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
                <input
                  type="search"
                  aria-label="Tìm danh mục"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="Tìm danh mục..."
                  className="h-9 w-full rounded-input border border-warm-200 bg-white pl-8 pr-2 text-sm text-warm-900 placeholder:text-warm-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
            </div>

            <SelectPrimitive.Viewport className="max-h-[260px] overflow-y-auto p-1">
              <SelectPrimitive.Item value={NONE} className={itemClass}>
                <SelectPrimitive.ItemText>
                  <span className="text-warm-400">{placeholder}</span>
                </SelectPrimitive.ItemText>
              </SelectPrimitive.Item>

              {!isPending && filteredRoots.length === 0 ? (
                <div className="px-2 py-3 text-center text-sm text-warm-500">
                  Không có danh mục phù hợp
                </div>
              ) : null}

              {isPending ? (
                <div className="px-2 py-3 text-center text-sm text-warm-500">
                  Đang tải…
                </div>
              ) : null}

              {filteredRoots.map((root) => {
                const children = root.children ?? [];
                if (children.length === 0) {
                  return (
                    <SelectPrimitive.Item
                      key={root.id}
                      value={root.id}
                      className={itemClass}
                    >
                      <SelectPrimitive.ItemText>
                        <OptionLabel cat={root} />
                      </SelectPrimitive.ItemText>
                    </SelectPrimitive.Item>
                  );
                }

                return (
                  <SelectPrimitive.Group key={root.id}>
                    <SelectPrimitive.Label className="sr-only">
                      Nhóm {root.name}
                    </SelectPrimitive.Label>
                    <SelectPrimitive.Item
                      value={root.id}
                      className={cn(itemClass, "font-semibold")}
                    >
                      <SelectPrimitive.ItemText>
                        <OptionLabel cat={root} />
                      </SelectPrimitive.ItemText>
                    </SelectPrimitive.Item>
                    {children.map((child) => (
                      <SelectPrimitive.Item
                        key={child.id}
                        value={child.id}
                        className={cn(itemClass, "pl-6")}
                      >
                        <SelectPrimitive.ItemText>
                          <OptionLabel cat={child} />
                        </SelectPrimitive.ItemText>
                      </SelectPrimitive.Item>
                    ))}
                  </SelectPrimitive.Group>
                );
              })}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {error ? (
        <p
          id="category-selector-error"
          className="mt-1 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
