import { AnimatedAmount } from "@/shared/components/ui/AnimatedAmount";
import { cn } from "@/shared/lib/utils";

export interface DebtSummaryBarProps {
  borrowedRemaining: number;
  lentRemaining: number;
  borrowedActiveCount: number;
  lentActiveCount: number;
  currency?: string;
  className?: string;
}

export function DebtSummaryBar({
  borrowedRemaining,
  lentRemaining,
  borrowedActiveCount,
  lentActiveCount,
  currency = "VND",
  className,
}: DebtSummaryBarProps) {
  return (
    <section
      className={cn(
        "grid gap-4 rounded-card border border-warm-200 bg-surface p-4 shadow-sm sm:grid-cols-2 sm:p-6",
        className)}
    >
      <div>
        <p className="text-sm font-medium text-danger">Tôi đang nợ</p>
        <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-danger sm:text-3xl">
          <AnimatedAmount value={borrowedRemaining} currency={currency} />
        </p>
        <p className="mt-1 text-xs text-warm-600">
          {borrowedActiveCount} khoản đang hoạt động
        </p>
      </div>
      <div>
        <p className="text-sm font-medium text-success">Người khác nợ tôi</p>
        <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-success sm:text-3xl">
          <AnimatedAmount value={lentRemaining} currency={currency} />
        </p>
        <p className="mt-1 text-xs text-warm-600">
          {lentActiveCount} khoản đang hoạt động
        </p>
      </div>
    </section>
  );
}
