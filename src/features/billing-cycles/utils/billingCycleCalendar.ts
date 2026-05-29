/** Mirrors BE <c>BillingCycleCalendar</c> for UI previews. */

function dayInMonth(year: number, month: number, dayOfMonth: number): Date {
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(dayOfMonth, last);
  return new Date(Date.UTC(year, month - 1, day));
}

function toDateOnlyString(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${String(y)}-${m}-${day}`;
}

function addDaysUtc(d: Date, days: number): Date {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function addMonthsUtc(d: Date, months: number): Date {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + months;
  return new Date(Date.UTC(y, m, d.getUTCDate()));
}

export interface BillingCyclePeriodPreview {
  periodStart: string;
  periodEnd: string;
  statementDate: string;
  paymentDueDate: string;
  defaultName: string;
}

function buildFromStatementDate(
  statementDate: Date,
  statementDay: number,
  paymentDueDaysAfterStatement: number,
): BillingCyclePeriodPreview {
  const periodEnd = addDaysUtc(statementDate, -1);
  const prev = addMonthsUtc(statementDate, -1);
  const periodStart = dayInMonth(
    prev.getUTCFullYear(),
    prev.getUTCMonth() + 1,
    statementDay,
  );
  const paymentDueDate = addDaysUtc(statementDate, paymentDueDaysAfterStatement);
  const month = statementDate.getUTCMonth() + 1;
  return {
    periodStart: toDateOnlyString(periodStart),
    periodEnd: toDateOnlyString(periodEnd),
    statementDate: toDateOnlyString(statementDate),
    paymentDueDate: toDateOnlyString(paymentDueDate),
    defaultName: `Kỳ sao kê tháng ${String(month)}`,
  };
}

export function previewBillingCycleForStatementMonth(
  statementYear: number,
  statementMonth: number,
  statementDay: number,
  paymentDueDaysAfterStatement: number,
): BillingCyclePeriodPreview {
  const statementDate = dayInMonth(statementYear, statementMonth, statementDay);
  return buildFromStatementDate(
    statementDate,
    statementDay,
    paymentDueDaysAfterStatement,
  );
}

export function statementMonthOfCycle(cycle: {
  statementDate: string;
}): { year: number; month: number } {
  const d = new Date(`${cycle.statementDate}T12:00:00Z`);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}
