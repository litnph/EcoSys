import type { MonthlyReportPeriodMode } from "../types";

export interface ReportingPeriodPreview {
  year: number;
  month: number;
  start: string;
  end: string;
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function boundary(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, Math.min(day, daysInMonth(year, monthIndex))));
}

function financeToday(): { year: number; monthIndex: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: value("year"), monthIndex: value("month") - 1, day: value("day") };
}

export function buildReportingPeriodPreview(
  reportDay: number,
  periodMode: MonthlyReportPeriodMode,
  locale: string,
): ReportingPeriodPreview {
  const today = financeToday();
  const cutoff = boundary(today.year, today.monthIndex, reportDay).getUTCDate();
  const targetMonthIndex = periodMode === "lowerBoundary"
    ? today.day < cutoff ? today.monthIndex : today.monthIndex + 1
    : today.day < cutoff ? today.monthIndex - 1 : today.monthIndex;
  const target = new Date(Date.UTC(today.year, targetMonthIndex, 1));
  const startMonth = periodMode === "lowerBoundary"
    ? new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() - 1, 1))
    : target;
  const endMonth = new Date(Date.UTC(startMonth.getUTCFullYear(), startMonth.getUTCMonth() + 1, 1));
  const startDate = boundary(startMonth.getUTCFullYear(), startMonth.getUTCMonth(), reportDay);
  const endDate = boundary(endMonth.getUTCFullYear(), endMonth.getUTCMonth(), reportDay);
  const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "vi-VN", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return {
    year: target.getUTCFullYear(),
    month: target.getUTCMonth() + 1,
    start: formatter.format(startDate),
    end: formatter.format(endDate),
  };
}
