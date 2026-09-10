import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarRange,
} from "lucide-react";

import type { KpiMetric } from "@/features/dashboard/utils/buildDashboardKpis";

import type { MonthlyReport } from "../types";
import { computeReportExpenseBreakdown } from "./reportExpenseBreakdown";

/** KPI row for monthly report detail (same order as dashboard). */
export function buildReportKpis(report: MonthlyReport): KpiMetric[] {
  const breakdown = computeReportExpenseBreakdown(report);
  const comp = report.comparisonWithPrevious;

  const metrics: KpiMetric[] = [
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
  ];

  return metrics.map((metric) => ({
    ...metric,
    currency: report.metadata?.currency ?? undefined,
  }));
}
