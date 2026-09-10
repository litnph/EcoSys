export const settingsKeys = {
  root: ["settings"] as const,
  profile: () => [...settingsKeys.root, "profile"] as const,
  classificationRules: () => [...settingsKeys.root, "classification-rules"] as const,
};
