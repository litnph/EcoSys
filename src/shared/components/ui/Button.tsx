"use client";

import { cn } from "@/shared/lib/utils";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import * as React from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "link";

export type ButtonSize = "sm" | "md" | "lg";

/** Props that clash with `motion.button` / Framer Motion's DOM typings. */
type MotionConflictingButtonKeys =
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration";

type NativeButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  MotionConflictingButtonKeys
>;

export interface ButtonProps extends NativeButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-dark disabled:hover:bg-accent",
  secondary:
    "bg-warm-100 text-warm-900 border border-warm-200 hover:bg-warm-200 disabled:hover:bg-warm-100",
  ghost:
    "text-warm-600 hover:bg-warm-100 hover:text-warm-900 disabled:hover:bg-transparent disabled:hover:text-warm-600",
  danger:
    "bg-danger text-white hover:bg-danger/90 disabled:hover:bg-danger",
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
      return "h-8 gap-1.5 px-3 text-sm";
    case "lg":
      return "h-12 gap-2 px-6 text-base";
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
      ...props
    },
    ref,
  ) {
    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        type={props.type ?? "button"}
        whileHover={
          variant === "primary" && !isDisabled ? { scale: 1.01 } : undefined
        }
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(
          "inline-flex items-center justify-center rounded-button font-medium transition-all duration-150",
          variant !== "link" && "shadow-sm",
          variant === "link" && "underline-offset-4 hover:underline",
          variantClasses[variant],
          sizeClasses(variant, size),
          isLoading && "cursor-wait opacity-70",
          isDisabled && "pointer-events-none",
          className,
        )}
        disabled={isDisabled}
        {...props}
      >
        {isLoading ? (
          <Loader2
            className={cn("shrink-0 animate-spin", spinnerSize(size))}
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
      </motion.button>
    );
  },
);

Button.displayName = "Button";
