import type { FinSource } from "@/features/sources/types";
import type { Transaction } from "../types";

/** Kỳ hiển thị dạng YYYY-MM hoặc `all` / `custom`. */
export type BillingPeriodKey = string;

export function currentBillingPeriodKey(reference = new Date()): string {
  const y = reference.getFullYear();
  const m = reference.getMonth() + 1;
  return `${String(y)}-${String(m).padStart(2, "0")}`;
}

export function previousMonthKey(periodKey: string): string {
  const [yStr, mStr] = periodKey.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const prev = new Date(y, m - 2, 1);
  return `${String(prev.getFullYear())}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
}

export function calendarMonthRangeFromKey(periodKey: string): {
  dateFrom: string;
  dateTo: string;
} {
  const [yStr, mStr] = periodKey.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const dim = new Date(y, m, 0).getDate();
  const mm = String(m).padStart(2, "0");
  return {
    dateFrom: `${String(y)}-${mm}-01`,
    dateTo: `${String(y)}-${mm}-${String(dim).padStart(2, "0")}`,
  };
}

function txnDayOfMonth(txnDate: string): number {
  return Number(txnDate.slice(8, 10));
}

function daysInMonth(periodKey: string): number {
  const [yStr, mStr] = periodKey.split("-");
  return new Date(Number(yStr), Number(mStr), 0).getDate();
}

/** Giao dịch đã nằm trong kỳ sao kê của tháng trước tháng N. */
function isOnPriorBillingCycleStatement(
  tx: Transaction,
  periodKey: string,
): boolean {
  const stmt = tx.billingCycleStatementMonth;
  if (!stmt) return false;
  return stmt < periodKey;
}

/**
 * Thẻ tín dụng — tháng N:
 * - Loại giao dịch đã nằm trong kỳ sao kê của các tháng trước N.
 * - Tháng N−1: toàn bộ giao dịch (theo ngày GD).
 * - Tháng N: ngày GD ≤ ngày sao kê tháng N.
 */
export function passesCreditCardMonthFilter(
  tx: Transaction,
  periodKey: string,
  statementDay: number,
): boolean {
  if (isOnPriorBillingCycleStatement(tx, periodKey)) return false;

  const monthKey = tx.txnDate.slice(0, 7);
  const prevKey = previousMonthKey(periodKey);

  if (monthKey === prevKey) return true;

  if (monthKey === periodKey) {
    const cutoff = Math.min(statementDay, daysInMonth(periodKey));
    return txnDayOfMonth(tx.txnDate) <= cutoff;
  }

  return false;
}

/** Khoảng ngày gửi API — từ đầu tháng N−1 đến cuối tháng N (client lọc chi tiết thẻ). */
export function apiDateRangeForBillingPeriod(
  periodKey: string,
  sources: FinSource[] | undefined,
): { dateFrom: string; dateTo: string } {
  void sources;
  const current = calendarMonthRangeFromKey(periodKey);
  const previous = calendarMonthRangeFromKey(previousMonthKey(periodKey));
  return {
    dateFrom: previous.dateFrom,
    dateTo: current.dateTo,
  };
}

export function passesBillingPeriodFilter(
  tx: Transaction,
  billingPeriod: string,
  sourceMap: Map<string, FinSource>,
): boolean {
  if (billingPeriod === "all") return true;
  if (billingPeriod === "custom") return true;

  const source = sourceMap.get(tx.sourceId);
  if (source?.type === "creditCard") {
    if (source.statementDay != null) {
      return passesCreditCardMonthFilter(
        tx,
        billingPeriod,
        source.statementDay,
      );
    }
    if (isOnPriorBillingCycleStatement(tx, billingPeriod)) return false;
  }

  return tx.txnDate.slice(0, 7) === billingPeriod;
}

export function billingPeriodLabel(
  periodKey: string,
  locale: string,
): string {
  if (periodKey === "all") return locale === "vi" ? "Tất cả" : "All";
  if (periodKey === "custom") return locale === "vi" ? "Tùy chỉnh" : "Custom";
  const [yStr, mStr] = periodKey.split("-");
  const m = Number(mStr);
  if (locale === "vi") return `Tháng ${String(m)}/${yStr}`;
  return `${yStr}-${String(m).padStart(2, "0")}`;
}

/** Combobox: Tất cả + 12 tháng năm hiện tại. */
export function billingPeriodOptions(
  reference = new Date(),
): Array<{ value: string; labelVi: string; labelEn: string }> {
  const y = reference.getFullYear();
  const opts: Array<{ value: string; labelVi: string; labelEn: string }> = [
    { value: "all", labelVi: "Tất cả", labelEn: "All" },
  ];
  for (let m = 1; m <= 12; m += 1) {
    const value = `${String(y)}-${String(m).padStart(2, "0")}`;
    opts.push({
      value,
      labelVi: `Tháng ${String(m)}`,
      labelEn: new Date(y, m - 1, 1).toLocaleString("en", { month: "long" }),
    });
  }
  return opts;
}

export function isDefaultBillingPeriod(period: string): boolean {
  return period === currentBillingPeriodKey();
}
