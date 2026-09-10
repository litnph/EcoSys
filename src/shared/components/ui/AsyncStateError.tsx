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
        "flex min-h-32 items-start gap-4 rounded-card border border-danger/30 bg-danger/5 px-4 py-5 text-left sm:px-5",
        className,
      )}
    >
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-button border border-danger/20 bg-danger/10 text-danger">
        <AlertTriangle className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-sm font-semibold text-warm-900">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-warm-600">{description}</p>
        {onRetry ? (
          <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
