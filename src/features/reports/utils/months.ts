export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function monthIsoRange(year: number, month: number): {
  dateFrom: string;
  dateTo: string;
} {
  const m = String(month).padStart(2, "0");
  const from = `${year}-${m}-01`;
  const last = String(daysInMonth(year, month)).padStart(2, "0");
  return { dateFrom: from, dateTo: `${year}-${m}-${last}` };
}

export function currentUtcYearMonth(now = new Date()): {
  year: number;
  month: number;
} {
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}
