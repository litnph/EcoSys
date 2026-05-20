export const investmentKeys = {
  all: ["investments"] as const,
  lists: () => [...investmentKeys.all, "list"] as const,
  list: (smoduleId: string) => [...investmentKeys.lists(), smoduleId] as const,
  detail: (id: string) => [...investmentKeys.all, "detail", id] as const,
};
