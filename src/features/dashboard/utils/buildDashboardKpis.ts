import type { LucideIcon } from "lucide-react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarRange,
  PiggyBank,
} from "lucide-react";

import type { DashboardSummary, MonthlyTrendPoint } from "../types";

export type KpiMetric = {
  id: string;
  label: string;
  amount: number;
  changePercent: number | null;
  positiveChangeIsGood: boolean;
  icon: LucideIcon;
  iconClassName: string;
  currency?: string;
};

function periodChangePercent(
  current: number,
  previous: number | undefined,
): number | null {
  if (previous === undefined || Math.abs(previous) < 1) {
    return null;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

/** Build KPI row: thu, chi, trả góp tháng này, tiết kiệm. */
export function buildDashboardKpis(
  summary: DashboardSummary,
  trend: MonthlyTrendPoint[],
  installmentThisMonth: number,
): KpiMetric[] {
  const prev = trend.length >= 2 ? trend[trend.length - 2] : undefined;

  const monthlySavings = summary.monthlyIncome - summary.monthlyExpense;
  const prevSavings =
    prev !== undefined ? prev.income - prev.expense : undefined;

  return [
    {
      id: "income",
      label: "Thu nhập tháng này",
      amount: summary.monthlyIncome,
      changePercent: periodChangePercent(
        summary.monthlyIncome,
        prev?.income,
      ),
      positiveChangeIsGood: true,
      icon: ArrowDownLeft,
      iconClassName: "bg-success/10 text-success",
    },
    {
      id: "expense",
      label: "Chi tiêu tháng này",
      amount: summary.monthlyExpense,
      changePercent: periodChangePercent(
        summary.monthlyExpense,
        prev?.expense,
      ),
      positiveChangeIsGood: false,
      icon: ArrowUpRight,
      iconClassName: "bg-danger/10 text-danger",
    },
    {
      id: "installment",
      label: "Trả góp tháng này",
      amount: installmentThisMonth,
      changePercent: null,
      positiveChangeIsGood: false,
      icon: CalendarRange,
      iconClassName: "bg-accent/10 text-accent",
    },
    {
      id: "savings",
      label: "Tiết kiệm tháng này",
      amount: monthlySavings,
      changePercent: periodChangePercent(monthlySavings, prevSavings),
      positiveChangeIsGood: true,
      icon: PiggyBank,
      iconClassName: "bg-info/10 text-info",
    },
  ];
}
