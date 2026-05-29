import type { FinSource } from "../types";

export interface CreditSourceBreakdown {
  limit: number;
  usedAmount: number;
  /** Chi tiêu thường (không thuộc kế hoạch trả góp). */
  spentAmount: number;
  /** Dư nợ còn lại trong các kế hoạch trả góp đang active. */
  installmentAmount: number;
  /** Hạn mức khả dụng. */
  availableAmount: number;
  bar: {
    spentPct: number;
    installmentPct: number;
    availablePct: number;
  };
}

/** Phân tích hạn mức thẻ tín dụng thành chi thường / trả góp / khả dụng. */
export function creditSourceBreakdown(
  source: FinSource,
): CreditSourceBreakdown | null {
  if (source.type !== "creditCard") return null;
  const limit = source.creditLimit;
  if (limit == null || limit <= 0) return null;

  const usedAmount = Math.max(0, source.balance);
  const installmentAmount = Math.min(
    Math.max(0, source.installmentRemainingAmount ?? 0),
    usedAmount);
  const spentAmount = Math.max(0, usedAmount - installmentAmount);
  const availableAmount = Math.max(0, limit - usedAmount);

  const usedBarPct = Math.min(100, (usedAmount / limit) * 100);
  const installmentShare =
    usedAmount > 0 ? installmentAmount / usedAmount : 0;
  const installmentPct = usedBarPct * installmentShare;
  const spentPct = usedBarPct - installmentPct;
  const availablePct = Math.max(0, 100 - usedBarPct);

  return {
    limit,
    usedAmount,
    spentAmount,
    installmentAmount,
    availableAmount,
    bar: { spentPct, installmentPct, availablePct },
  };
}

/** Số dư khả dụng cho nguồn không phải thẻ tín dụng. */
export function assetAvailableBalance(source: FinSource): number {
  return source.balance;
}
