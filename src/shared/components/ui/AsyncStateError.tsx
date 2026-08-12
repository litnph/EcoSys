import { AlertTriangle } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import { Button } from "./Button";

export interface AsyncStateErrorProps {
  title: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
}

export function AsyncStateError({
  title,
  description = "Không thể tải dữ liệu. Vui lòng thử lại.",
  retryLabel = "Thử lại",
  onRetry,
  className,
}: AsyncStateErrorProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex min-h-40 flex-col items-center justify-center rounded-card border border-danger/25 bg-danger/5 px-5 py-8 text-center",
        className,
      )}
    >
      <span className="mb-3 inline-flex size-10 items-center justify-center rounded-button bg-danger/10 text-danger">
        <AlertTriangle className="size-5" aria-hidden />
      </span>
      <h2 className="font-display text-base font-semibold text-warm-900">
        {title}
      </h2>
      <p className="mt-1 max-w-md text-sm leading-relaxed text-warm-600">
        {description}
      </p>
      {onRetry ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={onRetry}
        >
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
