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
  default: "bg-warm-100 text-warm-900 ring-1 ring-warm-200",
  success: "bg-success/15 text-success ring-1 ring-success/25",
  danger: "bg-danger/15 text-danger ring-1 ring-danger/25",
  warning: "bg-warning/15 text-warning ring-1 ring-warning/25",
  info: "bg-info/15 text-info ring-1 ring-info/25",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "rounded-badge px-2 py-0.5 text-xs font-medium",
  md: "rounded-badge px-2.5 py-1 text-sm font-medium",
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
        "inline-flex items-center justify-center whitespace-nowrap font-medium tabular-nums",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
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
