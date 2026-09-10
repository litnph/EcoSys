export type MonthlyPeriodStatus = "open" | "closed";

export interface MonthlyPeriodListItem {
  year: number;
  month: number;
  status: MonthlyPeriodStatus;
  totalIncome: number;
  totalExpense: number;
  net: number;
  reportCreatedAt: string;
  lastRefreshedAt: string | null;
  closedAt: string | null;
  currency: string | null;
  consolidatedTotalsAvailable: boolean;
  currencyGroups: MonthlyCurrencySummary[];
}

export interface MonthlyCurrencySummary {
  currency: string;
  totalIncome: number;
  totalExpense: number;
  net: number;
  savingsRatePercent: number | null;
}

/** Đối chiếu tháng trước (giá trị null khi không tính được). */
export interface Comparison {
  incomeChangePercent: number | null;
  expenseChangePercent: number | null;
  netChangePercent: number | null;
}

export interface CategoryBreakdownItem {
  categoryId: string | null;
  categoryName: string;
  amount: number;
  transactionCount: number;
  percentageOfTotalExpense: number;
}

export interface SourceBreakdownItem {
  sourceId: string;
  sourceName: string;
  expenseAmount: number;
}

/** Một ô trong biểu đồ chi / thu theo ngày (1 … số ngày trong tháng). */
export interface DailyPoint {
  day: number;
  income: number;
  expense: number;
}

export interface MonthlyReportDirectExpenseItem {
  id: string;
  amount: number;
  currency: string;
  txnDate: string;
  description: string;
  categoryName: string | null;
  categoryId: string | null;
  sourceId: string;
  sourceName: string;
}

export interface MonthlyReportDirectExpenseSection {
  totalAmount: number;
  transactionCount: number;
  items: MonthlyReportDirectExpenseItem[];
}

export type MonthlyReportBillingCycleStatus = "open" | "closed" | "paid" | "overdue";

export interface MonthlyReportBillingCycleTxnItem {
  id: string;
  amount: number;
  txnDate: string;
  description: string;
  categoryName: string | null;
  categoryId: string | null;
}

export type MonthlyReportInstallmentPayStatus =
  | "upcoming"
  | "due"
  | "paid"
  | "overdue";

export interface MonthlyReportBillingCycleInstallmentDue {
  payId: string;
  planId: string;
  planDescription: string;
  categoryName: string | null;
  categoryId: string | null;
  installmentNumber: number;
  totalInstallments: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: MonthlyReportInstallmentPayStatus;
}

export interface MonthlyReportBillingCycleItem {
  id: string;
  currency: string;
  sourceId: string;
  sourceName: string;
  name: string;
  periodStart: string;
  periodEnd: string;
  statementDate: string;
  paymentDueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: MonthlyReportBillingCycleStatus;
  transactions: MonthlyReportBillingCycleTxnItem[];
  installmentDues: MonthlyReportBillingCycleInstallmentDue[];
}

export interface MonthlyReportBillingCyclesSection {
  totalAmount: number;
  cycleCount: number;
  cycles: MonthlyReportBillingCycleItem[];
}

export interface MonthlyReportMetadata {
  formulaVersion: string;
  metricBasis: string;
  currency: string | null;
  timeZone: string;
  consolidatedTotalsAvailable: boolean;
  reportingPeriodStart: string | null;
  reportingPeriodEnd: string | null;
  monthlyReportDay: number;
}

export type BudgetTargetMode = "maximum" | "minimum";

export type BudgetUtilizationStatus =
  | "withinBudget"
  | "nearLimit"
  | "reached"
  | "exceeded"
  | "belowTarget"
  | "targetAchieved"
  | "targetExceeded";

export interface CategoryBudgetUtilization {
  categoryId: string;
  categoryName: string;
  currency: string;
  spentAmount: number;
  budgetAmount: number;
  targetMode: BudgetTargetMode;
  remainingAmount: number;
  utilizationPercent: number;
  status: BudgetUtilizationStatus;
  warningThresholds: number[];
}

export interface MonthlyReportCurrencyGroup {
  currency: string;
  totalIncome: number;
  totalExpense: number;
  net: number;
  savingsRate: number | null;
  categoryBreakdown: CategoryBreakdownItem[];
  sourceBreakdown: SourceBreakdownItem[];
  dailyBreakdown: DailyPoint[];
  comparisonWithPrevious: Comparison;
  directExpenses: MonthlyReportDirectExpenseSection;
  billingCycles: MonthlyReportBillingCyclesSection;
  budgetUtilizations: CategoryBudgetUtilization[];
}

export interface MonthlyReport {
  year: number;
  month: number;
  status: MonthlyPeriodStatus;
  totalIncome: number;
  totalExpense: number;
  net: number;
  savingsRate: number | null;
  categoryBreakdown: CategoryBreakdownItem[];
  sourceBreakdown: SourceBreakdownItem[];
  dailyBreakdown: DailyPoint[];
  comparisonWithPrevious: Comparison;
  directExpenses: MonthlyReportDirectExpenseSection;
  billingCycles: MonthlyReportBillingCyclesSection;
  metadata: MonthlyReportMetadata | null;
  currencyGroups: MonthlyReportCurrencyGroup[];
  budgetUtilizations: CategoryBudgetUtilization[];
  lastRefreshedAt?: string | null;
}
