import {
  AlertCircle,
  CreditCard,
  HandCoins,
  PiggyBank,
  Scale,
  Wallet,
} from "lucide-react";

import type { DashboardMetrics } from "../types";
import type { KpiMetric } from "./buildDashboardKpis";

export function buildDashboardMetricsKpis(
  metrics: DashboardMetrics,
): KpiMetric[] {
  return [
    {
      id: "cashBalance",
      label: "Số dư hiện tại",
      amount: metrics.cashBalance,
      changePercent: null,
      positiveChangeIsGood: true,
      icon: Wallet,
      iconClassName: "bg-accent/10 text-accent",
    },
    {
      id: "creditAvailable",
      label: "Hạn mức khả dụng",
      amount: metrics.creditAvailable,
      changePercent: null,
      positiveChangeIsGood: true,
      icon: CreditCard,
      iconClassName: "bg-success/10 text-success",
    },
    {
      id: "creditUsed",
      label: "Hạn mức đã dùng",
      amount: metrics.creditUsed,
      changePercent: null,
      positiveChangeIsGood: false,
      icon: Scale,
      iconClassName: "bg-warning/10 text-warning",
    },
    {
      id: "debtBorrowed",
      label: "Thiếu nợ",
      amount: metrics.debtBorrowedRemaining,
      changePercent: null,
      positiveChangeIsGood: false,
      icon: AlertCircle,
      iconClassName: "bg-danger/10 text-danger",
    },
    {
      id: "debtLent",
      label: "Nợ chưa thu hồi",
      amount: metrics.debtLentRemaining,
      changePercent: null,
      positiveChangeIsGood: false,
      icon: HandCoins,
      iconClassName: "bg-info/10 text-info",
    },
    {
      id: "savings",
      label: "Tiết kiệm",
      amount: metrics.savingsTotal,
      changePercent: null,
      positiveChangeIsGood: true,
      icon: PiggyBank,
      iconClassName: "bg-accent/10 text-accent-emphasis",
    },
  ];
}
