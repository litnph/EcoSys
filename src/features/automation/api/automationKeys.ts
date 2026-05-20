export const automationKeys = {
  all: ["automation-rules"] as const,
  list: () => [...automationKeys.all, "list"] as const,
};
