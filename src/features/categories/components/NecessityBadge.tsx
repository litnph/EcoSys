import { cn } from "@/shared/lib/utils";

import {
  necessityLevelBadgeClass,
  necessityLevelShortLabel,
} from "../lib/necessityLevelLabel";
import type { CategoryNecessityLevel } from "../types";

export function NecessityBadge({
  level,
  className,
  title,
}: {
  level: CategoryNecessityLevel;
  className?: string;
  title?: string;
}) {
  const label = necessityLevelShortLabel(level);
  if (!label) return null;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-badge px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        necessityLevelBadgeClass(level),
        className,
      )}
      title={title}
    >
      {label}
    </span>
  );
}
