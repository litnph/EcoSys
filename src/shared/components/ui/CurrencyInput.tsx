import { formatNumber } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";
import * as React from "react";

export interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  currency?: string;
  label?: string;
  error?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

function formatDisplay(amount: number, currency: string): string {
  if (amount === 0) return "";
  if (currency === "VND") {
    return formatNumber(Math.round(amount));
  }
  return formatNumber(amount);
}

function parseInput(raw: string, currency: string): number {
  const trimmed = raw.trim();
  if (trimmed === "") return 0;
  if (currency === "VND") {
    const digits = trimmed.replace(/\D/g, "");
    return digits === "" ? 0 : parseInt(digits, 10);
  }
  const normalized = trimmed.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}

function sanitizeWhileTyping(next: string, currency: string): string {
  if (currency === "VND") {
    return next.replace(/\D/g, "");
  }
  return next.replace(/[^\d.,-]/g, "");
}

export function CurrencyInput({
  value,
  onChange,
  currency = "VND",
  label,
  error,
  id,
  name,
  disabled,
  placeholder,
  className,
  required,
}: CurrencyInputProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const inputRef = React.useRef<HTMLInputElement>(null);
  const focusedRef = React.useRef(false);

  const syncFromProp = React.useCallback(() => {
    const el = inputRef.current;
    if (!el || focusedRef.current) return;
    el.value = formatDisplay(value, currency);
  }, [value, currency]);

  React.useEffect(() => {
    syncFromProp();
  }, [syncFromProp]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    focusedRef.current = true;
    const el = e.currentTarget;
    const raw =
      value === 0 && el.value === ""
        ? ""
        : currency === "VND"
          ? String(Math.round(value))
          : String(value);
    el.value = raw;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    focusedRef.current = false;
    const parsed = parseInput(e.currentTarget.value, currency);
    onChange(parsed);
    e.currentTarget.value = formatDisplay(parsed, currency);
  };

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    const cleaned = sanitizeWhileTyping(el.value, currency);
    if (el.value !== cleaned) {
      el.value = cleaned;
    }
    onChange(parseInput(cleaned, currency));
  };

  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-[13px] font-semibold text-warm-700"
        >
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="text"
          inputMode={currency === "VND" ? "numeric" : "decimal"}
          autoComplete="off"
          defaultValue={formatDisplay(value, currency)}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onInput={handleInput}
          className={cn(
            "relative z-[1] h-11 w-full rounded-input border bg-surface px-3 font-mono text-sm text-warm-900 transition-colors placeholder:text-warm-400",
            "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-warm-100 disabled:text-warm-500",
            error
              ? "border-danger focus:border-danger"
              : "border-warm-200")}
        />
      </div>
      {error ? (
          <p
            id={errorId}
            role="alert"
            className="mt-1.5 text-[13px] leading-5 text-danger"
          >
            {error}
          </p>
        ) : null}
    </div>
  );
}
