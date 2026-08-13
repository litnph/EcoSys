import type { InstallmentSchedulePay, InstallmentUpcomingPayBucket } from "../types";

export function bucketLabel(bucket: InstallmentUpcomingPayBucket): string {
  switch (bucket) {
    case "overdue":
      return "Quá hạn";
    case "dueToday":
      return "Hôm nay";
    case "thisMonth":
      return "Tháng này";
    case "nextMonth":
      return "Tháng sau";
    case "later":
    default:
      return "Sau này";
  }
}

export function bucketBadgeClass(bucket: InstallmentUpcomingPayBucket): string {
  switch (bucket) {
    case "overdue":
      return "bg-danger/10 text-danger ring-danger/20";
    case "dueToday":
      return "bg-warning/15 text-warning ring-warning/25";
    case "thisMonth":
      return "bg-accent/10 text-accent ring-accent/20";
    case "nextMonth":
      return "bg-amber-100 text-amber-900 ring-amber-200";
    case "later":
    default:
      return "bg-warm-100 text-warm-600 ring-warm-200";
  }
}

/** `YYYY-MM` for local calendar month. */
export function currentMonthKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${String(y)}-${m}`;
}

export function monthKeyLabel(monthKey: string): string {
  if (monthKey === "all") return "Tất cả";
  const [y, m] = monthKey.split("-").map(Number);
  if (!y || !m) return monthKey;
  return `Tháng ${String(m)}/${String(y)}`;
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return currentMonthKey(d);
}

function dueInMonth(isoDate: string, monthKey: string): boolean {
  const [y, m] = monthKey.split("-").map(Number);
  const key = isoDate.length >= 10 ? isoDate.slice(0, 10) : isoDate;
  const parts = key.split("-").map(Number);
  const dy = parts[0] ?? 0;
  const dm = parts[1] ?? 0;
  return dy === y && dm === m;
}

export function filterSchedulePays(
  pays: InstallmentSchedulePay[],
  opts: {
    monthKey: string;
    sourceId: string;
    includeOverdue: boolean;
  },
): InstallmentSchedulePay[] {
  const nowKey = currentMonthKey();
  const viewingCurrentMonth = opts.monthKey === nowKey;

  return pays.filter((p) => {
    if (opts.sourceId !== "all" && p.sourceId !== opts.sourceId) return false;

    if (opts.monthKey === "all") return true;

    if (dueInMonth(p.dueDate, opts.monthKey)) return true;

    if (
      opts.includeOverdue &&
      viewingCurrentMonth &&
      p.bucket === "overdue"
    ) {
      return true;
    }

    return false;
  });
}

export function uniqueSourceOptions(
  pays: InstallmentSchedulePay[],
): { id: string; name: string; icon?: string | null }[] {
  const map = new Map<string, { id: string; name: string; icon?: string | null }>();
  for (const p of pays) {
    if (!map.has(p.sourceId)) {
      map.set(p.sourceId, {
        id: p.sourceId,
        name: p.sourceName,
        icon: p.sourceIcon,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "vi"));
}
