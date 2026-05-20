export const savingsKeys = {
  all: ["savings"] as const,
  lists: () => [...savingsKeys.all, "list"] as const,
  list: (smoduleId: string) => [...savingsKeys.lists(), smoduleId] as const,
  detail: (id: string) => [...savingsKeys.all, "detail", id] as const,
};
