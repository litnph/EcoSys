import { useEffect, useMemo, useState } from "react";

import { Button } from "@/shared/components/ui/Button";
import { ColorPicker, IconPicker } from "@/shared/components/ui/IconColorPickers";
import { Input } from "@/shared/components/ui/Input";
import { Modal } from "@/shared/components/ui/Modal";
import {
  CATEGORY_ICON_PRESETS,
  COLOR_PRESETS,
} from "@/shared/lib/iconColorPresets";

import { useFlatCategories } from "../hooks/useFlatCategories";
import {
  useCreateCategory,
  useUpdateCategory,
} from "../hooks/useCategoryMutations";
import type {
  CategoryKind,
  CategoryNecessityLevel,
  FinCategory,
  FinCategoryFlat,
} from "../types";
import { CATEGORY_NECESSITY_LEVELS } from "../types";
import { categoryTintColor } from "../lib/categoryVisuals";
import { CategoryIconBadge } from "./CategoryIconBadge";
import { NecessityBadge } from "./NecessityBadge";

const DEFAULT_NECESSITY_LEVEL: CategoryNecessityLevel = "needs";

const KINDS: { value: CategoryKind; label: string }[] = [
  { value: "expense", label: "Chi tiêu" },
  { value: "income", label: "Thu nhập" },
  { value: "transfer", label: "Chuyển khoản" },
];

const DEFAULT_ICON = CATEGORY_ICON_PRESETS[0] ?? "📁";
const DEFAULT_COLOR = COLOR_PRESETS[0] ?? "#0891b2";

function getDescendantIds(
  flat: FinCategoryFlat[],
  categoryId: string,
): Set<string> {
  const ids = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const row of flat) {
      if (
        row.parentId &&
        (row.parentId === categoryId || ids.has(row.parentId)) &&
        !ids.has(row.id)
      ) {
        ids.add(row.id);
        changed = true;
      }
    }
  }
  return ids;
}

function parentLabel(row: FinCategoryFlat): string {
  const indent = row.depth > 0 ? `${"— ".repeat(row.depth)}` : "";
  const emoji = row.icon?.trim() ? `${row.icon.trim()} ` : "";
  return `${indent}${emoji}${row.name}`;
}

export function CategoryFormModal({
  isOpen,
  onClose,
  initial,
  defaultKind,
  defaultParentId = null,
}: {
  isOpen: boolean;
  onClose: () => void;
  initial?: FinCategory | null;
  defaultKind: CategoryKind;
  defaultParentId?: string | null;
}) {
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<CategoryKind>(defaultKind);
  const [parentId, setParentId] = useState<string | null>(null);
  const [icon, setIcon] = useState<string>(DEFAULT_ICON);
  const [color, setColor] = useState<string>(DEFAULT_COLOR);
  const [necessityLevel, setNecessityLevel] = useState<CategoryNecessityLevel>(
    DEFAULT_NECESSITY_LEVEL,
  );

  const { data: flatCategories = [] } = useFlatCategories(kind);

  const lockedParent = !initial && defaultParentId != null;

  const parentOptions = useMemo(() => {
    let options = flatCategories.filter((row) => row.depth === 0);
    if (!initial) return options;

    const excluded = getDescendantIds(flatCategories, initial.id);
    excluded.add(initial.id);
    return options.filter((row) => !excluded.has(row.id));
  }, [flatCategories, initial]);

  const iconPresets = useMemo(() => {
    const current = initial?.icon?.trim();
    if (current && !CATEGORY_ICON_PRESETS.includes(current as (typeof CATEGORY_ICON_PRESETS)[number])) {
      return [current, ...CATEGORY_ICON_PRESETS];
    }
    return CATEGORY_ICON_PRESETS;
  }, [initial]);

  const colorPresets = useMemo(() => {
    const current = initial?.color?.trim();
    if (current && !COLOR_PRESETS.includes(current as (typeof COLOR_PRESETS)[number])) {
      return [current, ...COLOR_PRESETS];
    }
    return COLOR_PRESETS;
  }, [initial]);

  const parentRow = useMemo(
    () =>
      parentId
        ? flatCategories.find((row) => row.id === parentId)
        : undefined,
    [flatCategories, parentId],
  );

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setKind(initial.kind);
      setParentId(initial.parentId);
      setIcon(initial.icon?.trim() || DEFAULT_ICON);
      setColor(initial.color?.trim() || DEFAULT_COLOR);
      setNecessityLevel(initial.necessityLevel ?? DEFAULT_NECESSITY_LEVEL);
    } else {
      setName("");
      setKind(defaultKind);
      setParentId(defaultParentId);
      setIcon(DEFAULT_ICON);
      setColor(DEFAULT_COLOR);
      setNecessityLevel(DEFAULT_NECESSITY_LEVEL);
    }
  }, [initial, defaultKind, defaultParentId, isOpen]);

  const pending = create.isPending || update.isPending;
  const isSubcategoryForm = lockedParent || parentId != null;
  const isSystemLocked = Boolean(initial?.isSystem);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        initial
          ? "Sửa danh mục"
          : isSubcategoryForm
            ? "Thêm danh mục con"
            : "Thêm danh mục"
      }
      size="lg"
    >
      <div
        className="mb-5 flex items-center gap-3 rounded-xl border border-warm-200 px-4 py-3"
        style={{ backgroundColor: categoryTintColor(color) }}
      >
        <CategoryIconBadge icon={icon} color={color} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-warm-900">
            {name.trim() || "Tên danh mục"}
          </p>
          <p className="mt-0.5 text-xs text-warm-600">
            {KINDS.find((k) => k.value === kind)?.label}
            {isSubcategoryForm && necessityLevel ? (
              <>
                {" · "}
                <NecessityBadge level={necessityLevel} className="ml-1 align-middle" />
              </>
            ) : null}
          </p>
        </div>
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (isSystemLocked || !name.trim()) return;
          const payload = {
            name: name.trim(),
            kind,
            parentId,
            icon: icon.trim() || null,
            color: color.trim() || null,
            necessityLevel: parentId ? necessityLevel : null,
          };
          if (initial) {
            update.mutate(
              { id: initial.id, data: payload },
              { onSuccess: onClose });
          } else {
            create.mutate(payload, { onSuccess: onClose });
          }
        }}
      >
        <Input label="Tên" value={name} disabled={isSystemLocked} onChange={(e) => setName(e.target.value)} />

        {isSystemLocked ? (
          <p className="rounded-lg border border-warm-200 bg-warm-50 px-3 py-2 text-sm text-warm-600">
            Danh mục hệ thống không thể chỉnh sửa qua giao diện.
          </p>
        ) : null}

        <label className="block text-sm font-medium text-warm-800">
          Loại
          <select
            className="mt-1 w-full rounded-input border border-warm-200 px-3 py-2"
            value={kind}
            disabled={Boolean(initial) || lockedParent}
            onChange={(e) => setKind(e.target.value as CategoryKind)}
          >
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-warm-800">
          Danh mục cha
          <select
            className="mt-1 w-full rounded-input border border-warm-200 px-3 py-2 disabled:bg-warm-50 disabled:text-warm-600"
            value={parentId ?? ""}
            disabled={lockedParent}
            onChange={(e) => {
              const nextParent = e.target.value ? e.target.value : null;
              setParentId(nextParent);
            }}
          >
            <option value="">Không (danh mục gốc)</option>
            {parentOptions.map((row) => (
              <option key={row.id} value={row.id}>
                {parentLabel(row)}
              </option>
            ))}
          </select>
          {lockedParent && parentRow ? (
            <p className="mt-1 text-xs text-warm-500">
              Danh mục con của &quot;{parentRow.name}&quot;.
            </p>
          ) : null}
        </label>

        {isSubcategoryForm ? (
          <label className="block text-sm font-medium text-warm-800">
            Mức độ cần thiết
            <select
              className="mt-1 w-full rounded-input border border-warm-200 px-3 py-2"
              value={necessityLevel}
              required
              onChange={(e) =>
                setNecessityLevel(e.target.value as CategoryNecessityLevel)
              }
            >
              {CATEGORY_NECESSITY_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <IconPicker
          label="Icon"
          value={icon}
          onChange={setIcon}
          presets={iconPresets}
        />

        <ColorPicker
          label="Màu"
          value={color}
          onChange={setColor}
          presets={colorPresets}
        />

        <Button type="submit" disabled={pending || isSystemLocked}>
          {initial ? "Lưu" : "Tạo"}
        </Button>
      </form>
    </Modal>
  );
}
