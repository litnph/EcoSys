"use client";

import { motion } from "framer-motion";
import { Briefcase, ChevronRight, FolderTree, User } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import type { Space } from "@/features/spaces/types";
import { slideUp } from "@/shared/lib/animations";
import { cn } from "@/shared/lib/utils";

export type SpaceSelectorProps = {
  spaces: Space[];
  selectedId?: string | null;
  onSelect: (space: Space) => void;
};

function getSpaceIcon(type: string): ReactNode {
  const t = (type ?? "").toLowerCase();
  if (t === "personal") return <User className="size-4" aria-hidden />;
  if (t === "team") return <Briefcase className="size-4" aria-hidden />;
  return <FolderTree className="size-4" aria-hidden />;
}

interface NodeRowProps {
  node: Space;
  selectedId?: string | null;
  expanded: Record<string, boolean>;
  onToggle: (id: string) => void;
  onSelect: (space: Space) => void;
}

function NodeRow({
  node,
  selectedId,
  expanded,
  onToggle,
  onSelect,
}: NodeRowProps) {
  const isSelected = node.id === selectedId;
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const isExpanded = expanded[node.id] !== false;
  const indentPx = Math.max(0, node.depth) * 20;

  return (
    <li>
      <div
        className={cn(
          "group flex items-stretch rounded-button transition-colors",
          isSelected
            ? "bg-accent/10"
            : "hover:bg-warm-100 focus-within:bg-warm-100",
        )}
        style={{ paddingLeft: indentPx }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(node.id)}
            className="flex size-9 shrink-0 items-center justify-center text-warm-500 outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-expanded={isExpanded}
            aria-label={
              isExpanded
                ? `Thu gọn ${node.name}`
                : `Mở rộng ${node.name}`
            }
          >
            <ChevronRight
              className={cn(
                "size-4 transition-transform",
                isExpanded && "rotate-90",
              )}
              aria-hidden
            />
          </button>
        ) : (
          <span className="size-9 shrink-0" aria-hidden />
        )}

        <button
          type="button"
          onClick={() => onSelect(node)}
          aria-pressed={isSelected}
          className={cn(
            "flex flex-1 items-center gap-2 px-2 py-2 text-left text-sm outline-none",
            "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
            isSelected
              ? "font-medium text-accent"
              : "text-warm-800",
          )}
        >
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-md",
              isSelected ? "bg-accent text-white" : "bg-warm-100 text-warm-600",
            )}
          >
            {getSpaceIcon(node.type)}
          </span>
          <span className="min-w-0 flex-1 truncate">{node.name}</span>
          {node.financeModuleEnabled ? (
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
              Finance
            </span>
          ) : null}
        </button>
      </div>

      {hasChildren && isExpanded ? (
        <ul className="mt-1 flex flex-col gap-1">
          {node.children?.map((child) => (
            <NodeRow
              key={child.id}
              node={child}
              selectedId={selectedId}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/** Tree view chọn space. Root tự động expand. */
export function SpaceSelector({
  spaces,
  selectedId,
  onSelect,
}: SpaceSelectorProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function toggle(id: string): void {
    setExpanded((prev) => ({ ...prev, [id]: prev[id] === false }));
  }

  return (
    <motion.div
      variants={slideUp}
      initial="initial"
      animate="animate"
      className="w-full max-w-xl"
    >
      <header className="mb-6 text-center">
        <h1 className="font-display text-2xl font-semibold text-warm-900 sm:text-3xl">
          Chọn không gian làm việc
        </h1>
        <p className="mt-2 text-sm text-warm-600">
          Mỗi không gian quản lý dữ liệu tài chính riêng. Bạn có thể đổi không gian
          bất kỳ lúc nào.
        </p>
      </header>

      <div className="rounded-card border border-warm-200 bg-surface p-3 shadow-sm">
        <ul className="flex flex-col gap-1" aria-label="Cây không gian">
          {spaces.map((root) => (
            <NodeRow
              key={root.id}
              node={root}
              selectedId={selectedId}
              expanded={expanded}
              onToggle={toggle}
              onSelect={onSelect}
            />
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
