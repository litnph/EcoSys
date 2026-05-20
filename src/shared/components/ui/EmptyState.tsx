"use client";

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
        "mx-auto flex max-w-lg flex-col items-center justify-center text-center px-4 py-10",
        className)}
    >
      <div className="mb-4 inline-flex shrink-0 text-warm-300 [&>svg]:size-14">
        {icon}
      </div>
      <h2 className="font-display text-lg font-semibold text-warm-700">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-warm-400">{description}</p>
      {action !== undefined ? (
        <Button
          type="button"
          variant="primary"
          className="mt-8"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
