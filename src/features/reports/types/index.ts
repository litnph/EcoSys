export type MonthlyPeriodStatus = "open" | "closed";

export interface MonthlyPeriodListItem {
  year: number;
  month: number;
  status: MonthlyPeriodStatus;
  totalIncome: number;
  totalExpense: number;
  net: number;
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
}
