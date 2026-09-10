import { apiClient } from "@/shared/lib/axios";
import { toApiWholeAmount } from "@/shared/lib/currencyUnits";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";
import type { ApiResponse } from "@/shared/types/api";

import type {
  BudgetStatus,
  BudgetTargetMode,
  CategoryBudget,
  CategoryBudgets,
  UpsertCategoryBudgetInput,
} from "../types";

interface RemoteBudget {
  categoryId: string;
  categoryName: string;
  currency: string;
  budgetAmount: number;
  targetMode?: string;
  isEnabled: boolean;
  warningCount: number;
  warningThresholds: number[];
  spentAmount: number;
  remainingAmount: number;
  utilizationPercent: number;
  status: string;
  configurationVersion: number;
}

interface RemoteBudgets {
  year: number;
  month: number;
  monthlyReportDay: number;
  periodStart: string;
  periodEnd: string;
  items: RemoteBudget[];
}

function unwrap<T>(body: ApiResponse<T>): T {
  if (!body.success || body.data === null || body.data === undefined) {
    throw new Error(getFailureMessageFromApiBody(body));
  }
  return body.data;
}

function status(value: string): BudgetStatus {
  return value === "nearLimit"
    || value === "reached"
    || value === "exceeded"
    || value === "belowTarget"
    || value === "targetAchieved"
    || value === "targetExceeded"
    ? value
    : "withinBudget";
}

function targetMode(value: string | undefined): BudgetTargetMode {
  return value === "minimum" ? "minimum" : "maximum";
}

function mapBudget(row: RemoteBudget): CategoryBudget {
  return {
    ...row,
    budgetAmount: Number(row.budgetAmount),
    targetMode: targetMode(row.targetMode),
    warningThresholds: (row.warningThresholds ?? []).map(Number),
    spentAmount: Number(row.spentAmount),
    remainingAmount: Number(row.remainingAmount),
    utilizationPercent: Number(row.utilizationPercent),
    status: status(row.status),
  };
}

export async function getCategoryBudgets(year?: number, month?: number): Promise<CategoryBudgets> {
  const params = year && month ? { year, month } : undefined;
  const { data: body } = await apiClient.get<ApiResponse<{ budgets: RemoteBudgets }>>(
    "/finance/category-budgets",
    { params },
  );
  const data = unwrap(body).budgets;
  return { ...data, items: (data.items ?? []).map(mapBudget) };
}

export async function upsertCategoryBudget(input: UpsertCategoryBudgetInput): Promise<void> {
  const { data: body } = await apiClient.put<ApiResponse<unknown>>(
    `/finance/category-budgets/${input.categoryId}`,
    {
      isEnabled: input.isEnabled,
      budgetAmount: toApiWholeAmount(input.budgetAmount),
      targetMode: input.targetMode,
      currency: input.currency,
      warningCount: input.warningCount,
      warningThresholds: input.warningThresholds,
    },
  );
  unwrap(body);
}
