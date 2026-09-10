import { cn } from "@/shared/lib/utils";
import * as React from "react";

export type BadgeVariant =
  | "default"
  | "success"
  | "danger"
  | "warning"
  | "info";

export type BadgeSize = "sm" | "md";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "border-warm-200 bg-warm-100 text-warm-800 before:bg-warm-400",
  success: "border-success/30 bg-success/10 text-success before:bg-success",
  danger: "border-danger/30 bg-danger/10 text-danger before:bg-danger",
  warning: "border-warning/30 bg-warning/10 text-warning before:bg-warning",
  info: "border-info/30 bg-info/10 text-info before:bg-info",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "rounded-badge px-2 py-0.5 text-xs font-semibold",
  md: "rounded-badge px-2.5 py-1 text-sm font-semibold",
};

export function Badge({
  className,
  variant = "default",
  size = "sm",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-1.5 whitespace-nowrap border font-medium tabular-nums before:size-1.5 before:shrink-0 before:rounded-full",
        variantClasses[variant],
        sizeClasses[size],
        className)}
      {...props}
      data-variant={variant}
    />
  );
}

/** Maps backend/API status strings to badge variants for finance entities. */
export function statusToBadgeVariant(status: string): BadgeVariant {
  const s = status.trim().toLowerCase();

  switch (s) {
    case "pending":
    case "closed":
    case "active":
      return "warning";

    case "completed":
    case "paid":
      return "success";

    case "cancelled":
    case "overdue":
      return "danger";

    case "open":
      return "info";

    default:
      return "default";
  }
}

export interface StatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: string;
}

export function StatusBadge({
  status,
  size = "sm",
  className,
  children,
  ...props
}: StatusBadgeProps) {
  const variant = statusToBadgeVariant(status);
  const label =
    children ??
    status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <Badge variant={variant} size={size} className={className} {...props}>
      {label}
    </Badge>
  );
}
