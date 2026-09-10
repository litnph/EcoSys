import * as React from "react";

import { cn } from "@/shared/lib/utils";

import { Button } from "./Button";

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: EmptyStateAction;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="region"
      className={cn(
        "mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-12 text-center",
        className)}
    >
      <div className="mb-4 inline-flex size-11 shrink-0 items-center justify-center rounded-button border border-warm-200 bg-warm-50 text-warm-500 [&>svg]:size-5">
        {icon}
      </div>
      <h2 className="font-display text-base font-semibold text-warm-900">
        {title}
      </h2>
      <p className="mt-1.5 text-sm leading-6 text-warm-500">{description}</p>
      {action !== undefined ? (
        <Button
          type="button"
          variant="primary"
          className="mt-5"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
