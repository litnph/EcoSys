import type { DebtRecordListItem } from "@/features/debt/types";
import type { Saving } from "@/features/savings/types";
import type { FinSource } from "@/features/sources/types";
import { creditSourceBreakdown } from "@/features/sources/utils/creditSourceBreakdown";

import type { DashboardCurrencyMetrics, DashboardMetrics } from "../types";

function isCreditCard(type: string): boolean {
  const k = type.toLowerCase();
  return type === "creditCard" || k.includes("credit");
}

export function computeDashboardMetrics(
  sources: FinSource[],
  debts: DebtRecordListItem[],
  savings: Saving[],
): DashboardMetrics {
  const groups = new Map<string, DashboardCurrencyMetrics>();
  const getGroup = (rawCurrency: string | null | undefined) => {
    const currency = rawCurrency?.trim().toUpperCase() || "VND";
    const current = groups.get(currency);
    if (current) return current;
    const created: DashboardCurrencyMetrics = {
      currency,
      cashBalance: 0,
      creditAvailable: 0,
      creditUsed: 0,
      debtBorrowedRemaining: 0,
      debtLentRemaining: 0,
      savingsTotal: 0,
    };
    groups.set(currency, created);
    return created;
  };

  for (const source of sources) {
    const group = getGroup(source.currency);
    if (isCreditCard(source.type)) {
      const breakdown = creditSourceBreakdown(source);
      if (breakdown) {
        group.creditAvailable += breakdown.availableAmount;
        group.creditUsed += breakdown.usedAmount;
      } else {
        const limit = source.creditLimit ?? 0;
        const used = Math.max(0, source.balance);
        group.creditUsed += used;
        group.creditAvailable += Math.max(0, limit - used);
      }
    } else {
      group.cashBalance += source.balance;
    }
  }

  for (const debt of debts) {
    const group = getGroup(debt.currency);
    if (debt.direction === "borrowed")
      group.debtBorrowedRemaining += debt.remainingAmount;
    else
      group.debtLentRemaining += debt.remainingAmount;
  }

  const sourcesById = new Map(sources.map((source) => [source.id, source]));
  for (const saving of savings) {
    const group = getGroup(sourcesById.get(saving.sourceId)?.currency);
    group.savingsTotal += Math.max(0, saving.currentAmount);
  }

  if (groups.size === 0)
    getGroup("VND");

  return {
    currencyGroups: [...groups.values()].sort((a, b) =>
      a.currency.localeCompare(b.currency)),
  };
}
