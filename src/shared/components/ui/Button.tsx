import { cn } from "@/shared/lib/utils";
import { Loader2 } from "lucide-react";
import * as React from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "link";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-accent bg-accent text-accent-foreground hover:border-accent-dark hover:bg-accent-dark disabled:hover:border-accent disabled:hover:bg-accent",
  secondary:
    "border border-warm-300 bg-surface text-warm-900 hover:border-border-strong hover:bg-warm-100 disabled:hover:border-warm-300 disabled:hover:bg-surface",
  ghost:
    "border border-transparent text-warm-600 hover:bg-warm-100 hover:text-warm-900 disabled:hover:bg-transparent disabled:hover:text-warm-600",
  danger:
    "border border-danger bg-danger text-white hover:bg-danger/90 disabled:hover:bg-danger",
  link:
    "border-0 bg-transparent px-0 py-0 text-accent shadow-none hover:text-accent-dark disabled:hover:text-accent",
};

function sizeClasses(variant: ButtonVariant, size: ButtonSize): string {
  if (variant === "link") {
    switch (size) {
      case "sm":
        return "h-auto min-h-0 gap-1.5 text-sm";
      case "lg":
        return "h-auto min-h-0 gap-2 text-base";
      default:
        return "h-auto min-h-0 gap-1.5 text-sm";
    }
  }
  switch (size) {
      case "sm":
        return "h-10 gap-1.5 px-3 text-sm";
      case "lg":
        return "h-11 gap-2 px-5 text-sm";
      default:
        return "h-10 gap-1.5 px-4 text-sm";
  }
}

function spinnerSize(size: ButtonSize): string {
  switch (size) {
    case "sm":
      return "size-3.5";
    case "lg":
      return "size-5";
    default:
      return "size-4";
  }
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      "aria-busy": ariaBusy,
      ...props
    },
    ref) {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={props.type ?? "button"}
        className={cn(
          "inline-flex items-center justify-center rounded-button font-semibold transition-colors duration-150",
          "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          variant === "link" && "underline-offset-4 hover:underline",
          variantClasses[variant],
          sizeClasses(variant, size),
          isLoading && "cursor-wait opacity-70",
          isDisabled && "cursor-not-allowed opacity-50",
          className)}
        disabled={isDisabled}
        aria-busy={ariaBusy ?? (isLoading || undefined)}
        {...props}
      >
        {isLoading ? (
          <Loader2
            className={cn(
              "shrink-0 animate-spin motion-reduce:animate-none",
              spinnerSize(size),
            )}
            aria-hidden
          />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        {children != null && children !== false && (
          <span className={cn(variant === "link" ? "inline" : "truncate")}>
            {children}
          </span>
        )}
        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  });

Button.displayName = "Button";
