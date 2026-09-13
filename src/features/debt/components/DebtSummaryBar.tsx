import { AnimatedAmount } from "@/shared/components/ui/AnimatedAmount";
import { cn } from "@/shared/lib/utils";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

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
        "grid gap-px overflow-hidden rounded-card border border-warm-200 bg-warm-200 sm:grid-cols-2",
        className)}
    >
      <div className="bg-surface p-4 sm:p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-danger">
          <ArrowUpRight className="size-4" aria-hidden /> Tôi đang nợ
        </p>
        <p className="mt-2 font-amount text-2xl font-semibold tabular-nums text-danger sm:text-3xl">
          <AnimatedAmount value={borrowedRemaining} currency={currency} />
        </p>
        <p className="mt-1 text-xs text-warm-600">
          {borrowedActiveCount} khoản đang hoạt động
        </p>
      </div>
      <div className="bg-surface p-4 sm:p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-success">
          <ArrowDownLeft className="size-4" aria-hidden /> Người khác nợ tôi
        </p>
        <p className="mt-2 font-amount text-2xl font-semibold tabular-nums text-success sm:text-3xl">
          <AnimatedAmount value={lentRemaining} currency={currency} />
        </p>
        <p className="mt-1 text-xs text-warm-600">
          {lentActiveCount} khoản đang hoạt động
        </p>
      </div>
    </section>
  );
}
