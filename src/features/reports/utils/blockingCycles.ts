import type { BillingCycle } from "@/features/billing-cycles/types";

function parsePeriodEndYm(isoDate: string): { year: number; month: number } {
  const head = isoDate.slice(0, 10);
  const [ys, ms] = head.split("-");
  const year = Number(ys);
  const month = Number(ms);
  return { year, month };
}

/**
 * Các kỳ sao kê chặn đóng tháng (theo PeriodEnd thuộc tháng chọn và trạng thái chưa closed/paid).
 * Khớp rule backend CloseMonthCommandHandler.
 */
export function billingCyclesBlockingCloseMonth(
  year: number,
  month: number,
  cycles: BillingCycle[],
): BillingCycle[] {
  return cycles.filter((c) => {
    const { year: cy, month: cm } = parsePeriodEndYm(c.periodEnd);
    if (cy !== year || cm !== month) return false;
    return c.status !== "closed" && c.status !== "paid";
  });
}
