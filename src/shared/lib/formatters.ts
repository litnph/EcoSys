import {
  format,
  formatDistanceToNow,
  type Locale,
} from "date-fns";
import { enUS, vi } from "date-fns/locale";
import { LOCALE_KEY } from "@/config/constants";

function getDateFnsLocale(): Locale {
  if (typeof window === "undefined") {
    return vi;
  }
  try {
    const stored = window.localStorage.getItem(LOCALE_KEY) ?? "vi";
    return stored.startsWith("en") ? enUS : vi;
  } catch {
    return vi;
  }
}

export function formatCurrency(amount: number, currency = "VND"): string {
  if (currency === "VND") {
    const formatted = new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: 0,
    }).format(amount);
    return `${formatted} ₫`;
  }
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(
  date: string | Date | null | undefined,
  formatStr?: string): string {
  if (date === null || date === undefined || date === "") return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  const locale = getDateFnsLocale();
  const pattern =
    formatStr ??
    (locale === vi ? "dd/MM/yyyy" : "MMM d, yyyy");
  return format(d, pattern, { locale });
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const locale = getDateFnsLocale();
  return formatDistanceToNow(d, { addSuffix: true, locale });
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("vi-VN").format(num);
}

export function formatPercentage(
  num: number,
  decimals = 1): string {
  const fixed = num.toFixed(decimals);
  return `${fixed}%`;
}
