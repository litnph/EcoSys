export const automationKeys = {
  all: ["automation-rules"] as const,
  list: (smoduleId: string) => [...automationKeys.all, "list", smoduleId] as const,
};
