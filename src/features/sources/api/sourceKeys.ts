export const sourceKeys = {
  all: ["sources"] as const,
  lists: () => [...sourceKeys.all, "list"] as const,
  list: (smoduleId: string) => [...sourceKeys.lists(), smoduleId] as const,
  detail: (id: string) => [...sourceKeys.all, "detail", id] as const,
  txCount: (smoduleId: string, sourceId: string) =>
    [...sourceKeys.all, "txCount", smoduleId, sourceId] as const,
};
