export const reportKeys = {
  all: ["reports"] as const,
  lists: () => [...reportKeys.all, "periods"] as const,
  list: (smoduleId: string) =>
    [...reportKeys.lists(), smoduleId] as const,
  details: () => [...reportKeys.all, "detail"] as const,
  detail: (smoduleId: string, year: number, month: number) =>
    [...reportKeys.details(), smoduleId, year, month] as const,
};
