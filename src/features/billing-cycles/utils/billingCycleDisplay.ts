import { formatDate } from "@/shared/lib/formatters";

import type { BillingCycle, BillingCycleItemInclusionSource } from "../types";

/** Default title from statement month when API name is empty. */
export function billingCycleDisplayName(cycle: BillingCycle): string {
  const trimmed = cycle.name?.trim();
  if (trimmed) return trimmed;
  const month = new Date(`${cycle.statementDate}T12:00:00`).getMonth() + 1;
  return `Kỳ sao kê tháng ${String(month)}`;
}

/** Period range label, e.g. 20/04/2025 — 19/05/2025. */
export function billingCyclePeriodLabel(cycle: BillingCycle): string {
  return `${formatDate(cycle.periodStart)} — ${formatDate(cycle.periodEnd)}`;
}

export function billingCycleInclusionLabel(
  source: BillingCycleItemInclusionSource,
): string {
  return source === "manualAdd" ? "Thêm tay" : "Tự động";
}
