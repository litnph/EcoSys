import type { Comparison } from "../types";

/** Ước tính tỷ lệ tiết kiệm tháng trước từ % thay đổi Thu/Chi (khi có đủ dữ kiện). */
export function estimatedPreviousSavingsRatePercent(params: {
  totalIncome: number;
  totalExpense: number;
  comparison: Comparison;
}): number | null {
  const { totalIncome: ci, totalExpense: ce, comparison } = params;
  const { incomeChangePercent: ip, expenseChangePercent: ep } = comparison;
  if (ci <= 0 || typeof ip !== "number" || typeof ep !== "number") {
    return null;
  }
  const denominator = 1 + ip / 100;
  if (denominator === 0 || !Number.isFinite(denominator)) return null;
  const denominatorE = 1 + ep / 100;
  if (denominatorE === 0 || !Number.isFinite(denominatorE)) return null;
  const prevIncome = ci / denominator;
  const prevExpense = ce / denominatorE;
  if (prevIncome <= 0) return null;
  const raw = ((prevIncome - prevExpense) / prevIncome) * 100;
  return Math.round(raw * 100) / 100;
}
