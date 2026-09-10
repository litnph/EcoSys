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
        "mb-6 flex flex-col items-stretch gap-4 border-b border-warm-200 pb-5 sm:flex-row sm:items-end sm:justify-between",
        className)}
    >
      <div className="min-w-0">
        <h1 className="font-display text-[1.625rem] font-semibold leading-tight tracking-[-0.025em] text-warm-900 sm:text-[1.75rem]">
          {title}
        </h1>
        {description !== undefined && description.length > 0 ? (
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-warm-500">
            {description}
          </p>
        ) : null}
      </div>
      {actions !== undefined ? (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0 sm:justify-end [&>button]:max-sm:flex-1">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
