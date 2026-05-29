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
  installmentNumber: number;
  totalInstallments: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: MonthlyReportInstallmentPayStatus;
}

export interface MonthlyReportBillingCycleItem {
  id: string;
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
  lastRefreshedAt?: string | null;
}
