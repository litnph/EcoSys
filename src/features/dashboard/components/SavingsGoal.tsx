import type { DashboardSummary } from "../types";
import { MonthlySavingsCard } from "./MonthlySavingsCard";

type SavingsGoalProps = {
  summary: DashboardSummary | undefined;
  isLoading: boolean;
};

export function SavingsGoal({ summary, isLoading }: SavingsGoalProps) {
  return (
    <MonthlySavingsCard
      isLoading={isLoading || summary === undefined}
      savingsRate={summary?.monthlySavingsRate ?? null}
      savedAmount={
        summary !== undefined
          ? summary.monthlyIncome - summary.monthlyExpense
          : 0
      }
      incomeAmount={summary?.monthlyIncome ?? 0}
    />
  );
}
