"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/shared/lib/utils";
import { formErrorMessage } from "@/shared/lib/animations";
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

    const [focused, setFocused] = React.useState(false);

    return (
      <div className="w-full">
        {label ? (
          <label
            htmlFor={inputId}
            className="mb-1 block text-sm font-medium text-warm-700"
          >
            {label}
          </label>
        ) : null}
        <div className="relative">
          <motion.span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 z-0 rounded-button ring-2",
              error ? "ring-danger/35" : "ring-accent/35")}
            initial={false}
            animate={{
              scale: focused ? 1 : 0.92,
              opacity: focused ? 1 : 0,
            }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          />
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
              "relative z-[1] h-10 w-full rounded-button border bg-warm-50 px-3 text-warm-900 transition-colors placeholder:text-warm-400",
              "focus:border-accent focus:outline-none focus:ring-0",
              error
                ? "border-danger focus:border-danger"
                : "border-warm-200",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className)}
            onFocus={(e) => {
              setFocused(true);
              onFocusProp?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlurProp?.(e);
            }}
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
        <AnimatePresence mode="wait">
          {error ? (
            <motion.p
              key={error}
              id={errorId}
              role="alert"
              variants={formErrorMessage}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mt-1 text-sm text-danger"
            >
              {error}
            </motion.p>
          ) : helperText ? (
            <motion.p
              key="helper"
              id={helperId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="mt-1 text-sm text-warm-400"
            >
              {helperText}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    );
  });

Input.displayName = "Input";
