/** UTC calendar date YYYY-MM-DD (aligned with API DateOnly comparisons). */
export function utcTodayDateOnly(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseDateOnly(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return { y, m, d };
}

function formatDateOnly(y: number, m: number, d: number): string {
  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${String(y)}-${mm}-${dd}`;
}

/** Due date for installment number (1-based), matching DateOnly.AddMonths on the server. */
export function dueDateForInstallment(
  startDateIso: string,
  installmentNumber: number,
): string {
  const { y, m, d } = parseDateOnly(startDateIso);
  const dt = new Date(Date.UTC(y, m - 1 + (installmentNumber - 1), d));
  return formatDateOnly(
    dt.getUTCFullYear(),
    dt.getUTCMonth() + 1,
    dt.getUTCDate(),
  );
}

export type InstallmentPayPreviewStatus = "paid" | "due" | "upcoming";

export function resolveInitialPayStatus(
  dueDateIso: string,
  todayIso: string = utcTodayDateOnly(),
): InstallmentPayPreviewStatus {
  if (dueDateIso < todayIso) return "paid";
  if (dueDateIso === todayIso) return "due";
  return "upcoming";
}

/** Count of installments that will be auto-marked paid when creating from a past transaction. */
export function countBackfillPaidInstallments(
  startDateIso: string,
  totalMonths: number,
  todayIso: string = utcTodayDateOnly(),
): number {
  let n = 0;
  for (let i = 1; i <= totalMonths; i++) {
    const due = dueDateForInstallment(startDateIso, i);
    if (resolveInitialPayStatus(due, todayIso) === "paid") n++;
  }
  return n;
}
