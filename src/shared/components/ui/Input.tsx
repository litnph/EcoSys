import { cn } from "@/shared/lib/utils";
import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** When true, the right icon slot receives pointer events (e.g. password toggle). */
  rightIconInteractive?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      rightIconInteractive = false,
      id,
      ...props
    },
    ref) {
    const {
      onFocus: onFocusProp,
      onBlur: onBlurProp,
      ...inputProps
    } = props;
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const describedBy =
      [error ? errorId : null, helperText && !error ? helperId : null]
        .filter(Boolean)
        .join(" ") || undefined;

    return (
      <div className="w-full">
        {label ? (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-[13px] font-semibold text-warm-700"
          >
            {label}
          </label>
        ) : null}
        <div className="relative">
          {leftIcon ? (
            <span className="pointer-events-none absolute left-3 top-1/2 z-[2] flex -translate-y-1/2 text-warm-600">
              {leftIcon}
            </span>
          ) : null}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              "relative z-[1] h-11 w-full rounded-input border bg-surface px-3 text-sm text-warm-900 transition-colors placeholder:text-warm-400",
              "focus:border-accent focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20",
              "disabled:cursor-not-allowed disabled:bg-warm-100 disabled:text-warm-500",
              error
                ? "border-danger focus:border-danger"
                : "border-warm-200",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className)}
            onFocus={onFocusProp}
            onBlur={onBlurProp}
            {...inputProps}
          />
          {rightIcon ? (
            <span
              className={cn(
                "absolute right-3 top-1/2 z-[2] flex -translate-y-1/2 text-warm-600",
                !rightIconInteractive && "pointer-events-none")}
            >
              {rightIcon}
            </span>
          ) : null}
        </div>
        {error ? (
            <p
              id={errorId}
              role="alert"
              className="mt-1.5 text-[13px] leading-5 text-danger"
            >
              {error}
            </p>
          ) : helperText ? (
            <p
              id={helperId}
              className="mt-1.5 text-[13px] leading-5 text-warm-500"
            >
              {helperText}
            </p>
          ) : null}
      </div>
    );
  });

Input.displayName = "Input";
