export const sourceKeys = {
  all: ["sources"] as const,
  lists: () => [...sourceKeys.all, "list"] as const,
  list: () => [...sourceKeys.lists()] as const,
  detail: (id: string) => [...sourceKeys.all, "detail", id] as const,
  txCount: (sourceId: string) =>
    [...sourceKeys.all, "txCount", sourceId] as const,
  balanceLedger: (sourceId: string) =>
    [...sourceKeys.all, "balanceLedger", sourceId] as const,
};
