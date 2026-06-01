import type { DebtSummary } from "@/features/debt/types";
import type { Saving } from "@/features/savings/types";
import type { FinSource } from "@/features/sources/types";
import { creditSourceBreakdown } from "@/features/sources/utils/creditSourceBreakdown";

import type { DashboardMetrics } from "../types";

function isCreditCard(type: string): boolean {
  const k = type.toLowerCase();
  return type === "creditCard" || k.includes("credit");
}

export function computeDashboardMetrics(
  sources: FinSource[],
  debt: DebtSummary,
  savings: Saving[],
): DashboardMetrics {
  let cashBalance = 0;
  let creditAvailable = 0;
  let creditUsed = 0;

  for (const source of sources) {
    if (isCreditCard(source.type)) {
      const breakdown = creditSourceBreakdown(source);
      if (breakdown) {
        creditAvailable += breakdown.availableAmount;
        creditUsed += breakdown.usedAmount;
      } else {
        const limit = source.creditLimit ?? 0;
        const used = Math.max(0, source.balance);
        creditUsed += used;
        creditAvailable += Math.max(0, limit - used);
      }
    } else {
      cashBalance += source.balance;
    }
  }

  const savingsTotal = savings.reduce(
    (sum, row) => sum + Math.max(0, row.currentAmount),
    0,
  );

  return {
    cashBalance,
    creditAvailable,
    creditUsed,
    debtBorrowedRemaining: debt.totalBorrowedRemaining,
    debtLentRemaining: debt.totalLentRemaining,
    savingsTotal,
  };
}
