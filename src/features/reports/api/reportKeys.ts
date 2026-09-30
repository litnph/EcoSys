export const reportKeys = {
  all: ["reports"] as const,
  lists: () => [...reportKeys.all, "periods"] as const,
  list: () =>
    [...reportKeys.lists()] as const,
  details: () => [...reportKeys.all, "detail"] as const,
  detail: (year: number, month: number) =>
    [...reportKeys.details(), year, month] as const,
  addable: (year: number, month: number) =>
    [...reportKeys.detail(year, month), "addable-transactions"] as const,
};
