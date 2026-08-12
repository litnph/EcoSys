const FINANCE_TIME_ZONE = "Asia/Bangkok";

/** Finance calendar date YYYY-MM-DD, aligned with the backend business calendar. */
export function businessTodayDateOnly(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: FINANCE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function parseDateOnly(iso: string): { y: number; m: number; d: number } {
  const [y = 0, m = 0, d = 0] = iso.slice(0, 10).split("-").map(Number);
  return { y, m, d };
}

function formatDateOnly(y: number, m: number, d: number): string {
  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${String(y)}-${mm}-${dd}`;
}

function monthAtOffset(y: number, m: number, offset: number): { y: number; m: number } {
  const value = new Date(Date.UTC(y, m - 1 + offset, 1));
  return { y: value.getUTCFullYear(), m: value.getUTCMonth() + 1 };
}

function dayInMonth(y: number, m: number, configuredDay: number): string {
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return formatDateOnly(y, m, Math.min(configuredDay, lastDay));
}

/**
 * Statement date for a 1-based installment number, matching schedule formula v2 on the server.
 * A purchase on the statement date is captured by the following statement.
 */
export function statementDateForInstallment(
  transactionDateIso: string,
  statementDay: number,
  installmentNumber: number,
): string {
  if (statementDay < 1 || statementDay > 31) {
    throw new RangeError("statementDay must be between 1 and 31");
  }
  if (installmentNumber < 1) {
    throw new RangeError("installmentNumber must be at least 1");
  }

  const transaction = parseDateOnly(transactionDateIso);
  const candidate = dayInMonth(transaction.y, transaction.m, statementDay);
  const firstMonthOffset = transactionDateIso.slice(0, 10) < candidate ? 0 : 1;
  const target = monthAtOffset(
    transaction.y,
    transaction.m,
    firstMonthOffset + installmentNumber - 1,
  );
  return dayInMonth(target.y, target.m, statementDay);
}

/** Actual card payment deadline for a scheduled installment. */
export function dueDateForInstallment(
  transactionDateIso: string,
  statementDay: number,
  paymentDueDaysAfterStatement: number,
  installmentNumber: number,
): string {
  if (paymentDueDaysAfterStatement < 1 || paymentDueDaysAfterStatement > 60) {
    throw new RangeError("paymentDueDaysAfterStatement must be between 1 and 60");
  }

  const statementDate = statementDateForInstallment(
    transactionDateIso,
    statementDay,
    installmentNumber,
  );
  const { y, m, d } = parseDateOnly(statementDate);
  const dueDate = new Date(Date.UTC(y, m - 1, d + paymentDueDaysAfterStatement));
  return formatDateOnly(
    dueDate.getUTCFullYear(),
    dueDate.getUTCMonth() + 1,
    dueDate.getUTCDate(),
  );
}

export type InstallmentPayPreviewStatus = "overdue" | "due" | "upcoming";

export function resolveInitialPayStatus(
  dueDateIso: string,
  todayIso: string = businessTodayDateOnly(),
): InstallmentPayPreviewStatus {
  if (dueDateIso < todayIso) return "overdue";
  if (dueDateIso === todayIso) return "due";
  return "upcoming";
}

/** Counts past payment deadlines; they remain unpaid and are shown as overdue. */
export function countPastDueInstallments(
  transactionDateIso: string,
  statementDay: number,
  paymentDueDaysAfterStatement: number,
  totalMonths: number,
  todayIso: string = businessTodayDateOnly(),
): number {
  let count = 0;
  for (let installmentNumber = 1; installmentNumber <= totalMonths; installmentNumber++) {
    const dueDate = dueDateForInstallment(
      transactionDateIso,
      statementDay,
      paymentDueDaysAfterStatement,
      installmentNumber,
    );
    if (resolveInitialPayStatus(dueDate, todayIso) === "overdue") count++;
  }
  return count;
}
