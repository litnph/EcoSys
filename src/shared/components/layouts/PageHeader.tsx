import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

export type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-6 flex items-start justify-between gap-4",
        className)}
    >
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold text-warm-900">
          {title}
        </h1>
        {description !== undefined && description.length > 0 ? (
          <p className="mt-1 text-sm text-warm-500">{description}</p>
        ) : null}
      </div>
      {actions !== undefined ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
