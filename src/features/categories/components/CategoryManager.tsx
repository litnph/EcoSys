import {
  ChevronDown,
  ChevronRight,
  FolderPlus,
  FolderTree,
  Lock,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState, useEffect, type ReactNode } from "react";

import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Input } from "@/shared/components/ui/Input";
import { SkeletonText } from "@/shared/components/ui/Skeleton";
import { listStaggerItemMotion, listStaggerMotion } from "@/shared/lib/animations";
import { cn } from "@/shared/lib/utils";

import { useCategories } from "../hooks/useCategories";
import { categoryBorderColor, categoryTintColor } from "../lib/categoryVisuals";
import {
  NECESSITY_LEGEND,
  necessityLevelLabel,
} from "../lib/necessityLevelLabel";
import type { CategoryKind, FinCategory } from "../types";
import { CategoryIconBadge } from "./CategoryIconBadge";
import { NecessityBadge } from "./NecessityBadge";

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

function filterTree(roots: FinCategory[], query: string): FinCategory[] {
  if (!query) return roots;
  const result: FinCategory[] = [];
  for (const root of roots) {
    const children = (root.children ?? []).filter((child) =>
      child.name.toLowerCase().includes(query),
    );
    const rootMatches = root.name.toLowerCase().includes(query);
    if (rootMatches) {
      result.push(root);
    } else if (children.length > 0) {
      result.push({ ...root, children });
    }
  }
  return result;
}

function countCategories(
  roots: FinCategory[],
  kind: CategoryKind,
): { groups: number; items: number } {
  if (kind !== "expense") {
    return { groups: roots.length, items: 0 };
  }
  let items = 0;
  for (const root of roots) {
    items += (root.children ?? []).length;
  }
  return { groups: roots.length, items };
}

interface FlatCategoryCardProps {
  category: FinCategory;
  onEdit: (category: FinCategory) => void;
  onDelete: (category: FinCategory) => void;
}

function FlatCategoryCard({
  category,
  onEdit,
  onDelete,
}: FlatCategoryCardProps) {
  return (
    <article
      className="flex items-center gap-3 rounded-card border border-warm-200 p-4 shadow-sm transition-shadow hover:shadow-md"
      style={{
        backgroundColor: categoryTintColor(category.color),
        borderColor: categoryBorderColor(category.color),
      }}
    >
      <CategoryIconBadge icon={category.icon} color={category.color} size="lg" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-semibold text-warm-900">
          {category.name}
        </h3>
        {category.isDefault ? (
          <p className="mt-0.5 text-xs text-warm-600">Mặc định</p>
        ) : null}
      </div>
      {!category.isSystem ? (
        <div className="flex shrink-0 items-center gap-0.5">
          <ActionButton label="Sửa" onClick={() => onEdit(category)}>
            <Pencil className="size-4" />
          </ActionButton>
          {!category.isDefault ? (
            <ActionButton
              label="Xóa"
              tone="danger"
              onClick={() => onDelete(category)}
            >
              <Trash2 className="size-4" />
            </ActionButton>
          ) : null}
        </div>
      ) : (
        <span
          className="inline-flex items-center gap-1 rounded-badge bg-white/70 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-warm-500"
          title="Danh mục hệ thống"
        >
          <Lock className="size-3" aria-hidden />
          Hệ thống
        </span>
      )}
    </article>
  );
}

interface CategoryGroupCardProps {
  group: FinCategory;
  defaultOpen?: boolean;
  searchActive: boolean;
  onEdit: (category: FinCategory) => void;
  onAddChild: (category: FinCategory) => void;
  onDelete: (category: FinCategory) => void;
}

function CategoryGroupCard({
  group,
  defaultOpen = true,
  searchActive,
  onEdit,
  onAddChild,
  onDelete,
}: CategoryGroupCardProps) {
  const [open, setOpen] = useState(defaultOpen || searchActive);
  const children = group.children ?? [];
  const isOpen = searchActive || open;

  return (
    <article
      className="flex w-full flex-col self-start overflow-hidden rounded-card border border-warm-200 shadow-sm transition-shadow hover:shadow-md"
      style={{
        backgroundColor: categoryTintColor(group.color),
        borderColor: categoryBorderColor(group.color),
      }}
    >
      <div className="flex items-start gap-3 p-4">
        <CategoryIconBadge icon={group.icon} color={group.color} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-warm-900">
                {group.name}
              </h3>
              <p className="mt-0.5 text-xs text-warm-600">
                {children.length} danh mục con
                {group.isDefault ? " · Mặc định" : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              {!group.isSystem ? (
                <>
                  <ActionButton
                    label="Thêm danh mục con"
                    onClick={() => onAddChild(group)}
                  >
                    <FolderPlus className="size-4" />
                  </ActionButton>
                  <ActionButton label="Sửa" onClick={() => onEdit(group)}>
                    <Pencil className="size-4" />
                  </ActionButton>
                  {!group.isDefault ? (
                    <ActionButton
                      label="Xóa"
                      tone="danger"
                      onClick={() => onDelete(group)}
                    >
                      <Trash2 className="size-4" />
                    </ActionButton>
                  ) : null}
                </>
              ) : (
                <span
                  className="inline-flex items-center gap-1 rounded-badge bg-white/70 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-warm-500"
                  title="Danh mục hệ thống"
                >
                  <Lock className="size-3" aria-hidden />
                  Hệ thống
                </span>
              )}
            </div>
          </div>
        </div>
        {children.length > 0 ? (
          <button
            type="button"
            className="mt-1 rounded-md p-1 text-warm-500 hover:bg-white/60"
            aria-expanded={isOpen}
            aria-label={isOpen ? "Thu gọn" : "Mở rộng"}
            onClick={() => setOpen((value) => !value)}
          >
            {isOpen ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>
        ) : null}
      </div>

      {isOpen && children.length > 0 ? (
        <ul className="space-y-1 border-t border-white/50 bg-white/45 px-3 py-3">
          {children.map((child) => (
            <li
              key={child.id}
              className="group flex items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-white/80"
            >
              <CategoryIconBadge
                icon={child.icon ?? group.icon}
                color={child.color ?? group.color}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-warm-900">
                  {child.name}
                </p>
                {child.necessityLevel ? (
                  <p
                    className="mt-0.5 truncate text-[11px] text-warm-500"
                    title={necessityLevelLabel(child.necessityLevel) ?? undefined}
                  >
                    {necessityLevelLabel(child.necessityLevel)}
                  </p>
                ) : null}
              </div>
              {child.necessityLevel ? (
                <NecessityBadge
                  level={child.necessityLevel}
                  title={necessityLevelLabel(child.necessityLevel) ?? undefined}
                />
              ) : null}
              {!child.isSystem ? (
                <div className="flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                  <ActionButton label="Sửa" onClick={() => onEdit(child)}>
                    <Pencil className="size-3.5" />
                  </ActionButton>
                  {!child.isDefault ? (
                    <ActionButton
                      label="Xóa"
                      tone="danger"
                      onClick={() => onDelete(child)}
                    >
                      <Trash2 className="size-3.5" />
                    </ActionButton>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function ActionButton({
  children,
  label,
  tone = "default",
  onClick,
}: {
  children: ReactNode;
  label: string;
  tone?: "default" | "danger";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-md p-1.5 transition-colors",
        tone === "danger"
          ? "text-warm-500 hover:bg-rose-50 hover:text-danger"
          : "text-warm-500 hover:bg-white/70 hover:text-warm-800",
      )}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export interface CategoryManagerProps {
  kind: CategoryKind;
  onEdit: (category: FinCategory) => void;
  onAddChild: (category: FinCategory) => void;
  onDelete: (category: FinCategory) => void;
}

export function CategoryManager({
  kind,
  onEdit,
  onAddChild,
  onDelete,
}: CategoryManagerProps) {
  const { data, isPending, isError } = useCategories(kind);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSearch("");
  }, [kind]);

  const roots = useMemo(
    () => (data ?? []).filter((row) => row.kind === kind),
    [data, kind],
  );

  const query = normalizeSearch(search);
  const isExpenseKind = kind === "expense";
  const filteredRoots = useMemo(() => {
    if (!isExpenseKind) {
      if (!query) return roots;
      return roots.filter((row) => row.name.toLowerCase().includes(query));
    }
    return filterTree(roots, query);
  }, [roots, query, isExpenseKind]);
  const stats = useMemo(() => countCategories(roots, kind), [roots, kind]);
  const searchActive = query.length > 0;

  const { leftColumn, rightColumn } = useMemo(() => {
    const left: FinCategory[] = [];
    const right: FinCategory[] = [];
    filteredRoots.forEach((group, index) => {
      if (index % 2 === 0) left.push(group);
      else right.push(group);
    });
    return { leftColumn: left, rightColumn: right };
  }, [filteredRoots]);

  const renderGroup = (group: FinCategory) => (
    <motion.div key={group.id} {...listStaggerItemMotion} className="w-full">
      <CategoryGroupCard
        group={group}
        searchActive={searchActive}
        onEdit={onEdit}
        onAddChild={onAddChild}
        onDelete={onDelete}
      />
    </motion.div>
  );

  const renderFlat = (category: FinCategory) => (
    <motion.div key={category.id} {...listStaggerItemMotion} className="w-full">
      <FlatCategoryCard
        category={category}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </motion.div>
  );

  if (isPending) {
    return (
      <div className="space-y-4" aria-busy="true">
        <SkeletonText className="h-10 w-full max-w-md rounded-input" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonText key={i} className="h-48 w-full rounded-card" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-card border border-danger/30 bg-danger/5 p-6 text-sm text-danger">
        Không tải được danh mục. Kiểm tra kết nối API và quyền truy cập.
      </div>
    );
  }

  return (
    <div key={kind} className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-warm-400"
            aria-hidden
          />
          <Input
            aria-label="Tìm danh mục"
            placeholder={
              isExpenseKind
                ? "Tìm theo tên nhóm hoặc danh mục con…"
                : "Tìm theo tên danh mục…"
            }
            value={search}
            className="pl-9"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <p className="text-sm text-warm-600">
          {isExpenseKind ? (
            <>
              <span className="font-medium text-warm-800">{stats.groups}</span> nhóm
              {" · "}
              <span className="font-medium text-warm-800">{stats.items}</span>{" "}
              danh mục con
            </>
          ) : (
            <>
              <span className="font-medium text-warm-800">{stats.groups}</span>{" "}
              danh mục
            </>
          )}
        </p>
      </div>

      {kind === "expense" ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-warm-200 bg-warm-50/80 px-3 py-2">
          <span className="text-xs font-medium text-warm-600">Mức độ:</span>
          {NECESSITY_LEGEND.map((item) => (
            <span
              key={item.value}
              className={cn(
                "inline-flex items-center rounded-badge px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
                item.badgeClass,
              )}
            >
              {item.shortLabel}
            </span>
          ))}
        </div>
      ) : null}

      {filteredRoots.length === 0 ? (
        <EmptyState
          icon={<FolderTree aria-hidden />}
          title={searchActive ? "Không tìm thấy danh mục" : "Chưa có danh mục"}
          description={
            searchActive
              ? "Thử từ khóa khác hoặc xóa bộ lọc tìm kiếm."
              : "Thêm danh mục đầu tiên cho loại này."
          }
        />
      ) : isExpenseKind ? (
        <>
          <motion.div {...listStaggerMotion} className="flex flex-col gap-4 lg:hidden">
            {filteredRoots.map(renderGroup)}
          </motion.div>
          <motion.div
            {...listStaggerMotion}
            className="hidden gap-4 lg:grid lg:grid-cols-2 lg:items-start"
          >
            <div className="flex flex-col gap-4">{leftColumn.map(renderGroup)}</div>
            <div className="flex flex-col gap-4">{rightColumn.map(renderGroup)}</div>
          </motion.div>
        </>
      ) : (
        <motion.div
          {...listStaggerMotion}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {filteredRoots.map(renderFlat)}
        </motion.div>
      )}
    </div>
  );
}
