import { ChevronDown, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useCallback, useState } from "react";

import { cn } from "@/shared/lib/utils";
import { SkeletonText } from "@/shared/components/ui/Skeleton";
import { listStaggerItemMotion, listStaggerMotion } from "@/shared/lib/animations";

import { useCategories } from "../hooks/useCategories";
import { necessityLevelLabel } from "../lib/necessityLevelLabel";
import type { CategoryKind, FinCategory } from "../types";

export interface CategoryTreeProps {
  kind: CategoryKind;
  className?: string;
  /** Danh mục gốc — nếu không truyền sẽ gọi API trong component. */
  roots?: FinCategory[];
}

function colorDot(color: string | null | undefined) {
  if (!color?.trim()) return null;
  return (
    <span
      className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full border border-warm-200"
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}

interface CategoryTreeBranchProps {
  node: FinCategory;
  depth: number;
}

function CategoryTreeBranch({ node, depth }: CategoryTreeBranchProps) {
  const children = node.children ?? [];
  const hasChildren = children.length > 0;
  const [open, setOpen] = useState(true);

  const toggle = useCallback(() => {
    if (hasChildren) setOpen((o) => !o);
  }, [hasChildren]);

  const Icon = open ? ChevronDown : ChevronRight;

  return (
    <div className={cn(depth > 0 && "ml-3 border-l border-warm-200 pl-2")}>
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm text-warm-900 transition-colors hover:bg-warm-100",
          !hasChildren && "cursor-default hover:bg-transparent")}
        aria-expanded={hasChildren ? open : undefined}
      >
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-warm-500">
          {hasChildren ? <Icon className="h-4 w-4" /> : null}
        </span>
        {colorDot(node.color)}
        {node.icon?.trim() ? (
          <span className="shrink-0 text-base leading-none" aria-hidden>
            {node.icon.trim()}
          </span>
        ) : null}
        <span className="min-w-0 flex-1 font-medium leading-snug">{node.name}</span>
        {node.isDefault ? (
          <span className="shrink-0 rounded-badge bg-warm-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warm-600">
            Mặc định
          </span>
        ) : null}
        {depth > 0 && node.necessityLevel ? (
          <span
            className="shrink-0 max-w-[9rem] truncate rounded-badge bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-800"
            title={necessityLevelLabel(node.necessityLevel) ?? undefined}
          >
            {necessityLevelLabel(node.necessityLevel)}
          </span>
        ) : null}
      </button>

      {hasChildren && open ? (
        <div className="mt-0.5 space-y-0.5">
          {children.map((ch) => (
            <CategoryTreeBranch key={ch.id} node={ch} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CategoryTree({
  kind,
  className,
  roots: rootsProp,
}: CategoryTreeProps) {
  const fetchEnabled = rootsProp === undefined;
  const query = useCategories(fetchEnabled ? kind : undefined);

  const roots = rootsProp ?? query.data ?? [];

  const showLoading = fetchEnabled && query.isLoading;
  const showError = fetchEnabled && query.isError;
  const showEmpty = roots.length === 0 && !showLoading;

  return (
    <div className={cn("rounded-card border border-warm-200 bg-warm-50 p-3", className)}>
      {showLoading ? (
        <div className="space-y-3 py-1" aria-busy="true" aria-label="Đang tải danh mục">
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonText key={i} className="h-8 w-full rounded-md" />
          ))}
        </div>
      ) : null}

      {showError ? (
        <p className="text-sm text-danger">Không tải được danh mục.</p>
      ) : null}

      {showEmpty ? (
        <p className="text-sm text-warm-500">Chưa có danh mục cho loại này.</p>
      ) : null}

      {!showLoading && roots.length > 0 ? (
        <motion.div
          {...listStaggerMotion}
          className="space-y-0.5"
        >
          {roots.map((node) => (
            <motion.div key={node.id} {...listStaggerItemMotion}>
              <CategoryTreeBranch node={node} depth={0} />
            </motion.div>
          ))}
        </motion.div>
      ) : null}
    </div>
  );
}
