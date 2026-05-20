export const tagKeys = {
  all: ["tags"] as const,
  list: (smoduleId: string) => [...tagKeys.all, "list", smoduleId] as const,
};
