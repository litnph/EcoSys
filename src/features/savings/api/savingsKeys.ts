export const savingsKeys = {
  all: ["savings"] as const,
  lists: () => [...savingsKeys.all, "list"] as const,
  list: () => [...savingsKeys.lists()] as const,
  detail: (id: string) => [...savingsKeys.all, "detail", id] as const,
};
