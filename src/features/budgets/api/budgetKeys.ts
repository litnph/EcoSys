export const budgetKeys = {
  all: ["category-budgets"] as const,
  list: (year?: number, month?: number) =>
    [...budgetKeys.all, "list", year ?? "current", month ?? "current"] as const,
};
