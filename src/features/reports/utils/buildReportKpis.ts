import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarRange,
  PiggyBank,
} from "lucide-react";

import type { KpiMetric } from "@/features/dashboard/utils/buildDashboardKpis";

import type { MonthlyReport } from "../types";
import { computeReportExpenseBreakdown } from "./reportExpenseBreakdown";
import { estimatedPreviousSavingsRatePercent } from "./savingsComparison";

function savingsChangePercent(report: MonthlyReport): number | null {
  if (report.savingsRate === null) return null;
  const prevSr = estimatedPreviousSavingsRatePercent({
    totalIncome: report.totalIncome,
    totalExpense: report.totalExpense,
    comparison: report.comparisonWithPrevious,
  });
  if (prevSr === null || Math.abs(prevSr) < 0.001) return null;
  return (
    Math.round(
      ((report.savingsRate - prevSr) / Math.abs(prevSr)) * 10000,
    ) / 100
  );
}

/** KPI row for monthly report detail (same order as dashboard). */
export function buildReportKpis(report: MonthlyReport): KpiMetric[] {
  const breakdown = computeReportExpenseBreakdown(report);
  const comp = report.comparisonWithPrevious;
  const saved = report.totalIncome - report.totalExpense;

  return [
    {
      id: "income",
      label: "Thu nhập tháng này",
      amount: report.totalIncome,
      changePercent: comp.incomeChangePercent,
      positiveChangeIsGood: true,
      icon: ArrowDownLeft,
      iconClassName: "bg-success/10 text-success",
    },
    {
      id: "expense",
      label: "Chi tiêu tháng này",
      amount: report.totalExpense,
      changePercent: comp.expenseChangePercent,
      positiveChangeIsGood: false,
      icon: ArrowUpRight,
      iconClassName: "bg-danger/10 text-danger",
    },
    {
      id: "installment",
      label: "Trả góp tháng này",
      amount: breakdown.installmentAmount,
      changePercent: null,
      positiveChangeIsGood: false,
      icon: CalendarRange,
      iconClassName: "bg-accent/10 text-accent",
    },
    {
      id: "savings",
      label: "Tiết kiệm tháng này",
      amount: saved,
      changePercent: savingsChangePercent(report),
      positiveChangeIsGood: true,
      icon: PiggyBank,
      iconClassName: "bg-info/10 text-info",
    },
  ];
}
