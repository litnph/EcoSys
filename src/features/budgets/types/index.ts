export type BudgetTargetMode = "maximum" | "minimum";

export type BudgetStatus =
  | "withinBudget"
  | "nearLimit"
  | "reached"
  | "exceeded"
  | "belowTarget"
  | "targetAchieved"
  | "targetExceeded";

export interface CategoryBudget {
  categoryId: string;
  categoryName: string;
  currency: string;
  budgetAmount: number;
  targetMode: BudgetTargetMode;
  isEnabled: boolean;
  warningCount: number;
  warningThresholds: number[];
  spentAmount: number;
  remainingAmount: number;
  utilizationPercent: number;
  status: BudgetStatus;
  configurationVersion: number;
}

export interface CategoryBudgets {
  year: number;
  month: number;
  monthlyReportDay: number;
  periodStart: string;
  periodEnd: string;
  items: CategoryBudget[];
}

export interface UpsertCategoryBudgetInput {
  categoryId: string;
  isEnabled: boolean;
  budgetAmount: number;
  targetMode: BudgetTargetMode;
  currency: string;
  warningCount: number;
  warningThresholds: number[];
}
