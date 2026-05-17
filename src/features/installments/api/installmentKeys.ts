export const installmentKeys = {
  all: ["installments"] as const,
  lists: () => [...installmentKeys.all, "list"] as const,
  list: (smoduleId: string, status?: string) =>
    [...installmentKeys.lists(), smoduleId, status ?? "all"] as const,
  details: () => [...installmentKeys.all, "detail"] as const,
  detail: (id: string) => [...installmentKeys.details(), id] as const,
};
