export type { AutomationRule } from "./types";
export { automationKeys } from "./api/automationKeys";
export {
  useAutomationRules,
  useCreateAutomationRule,
  useToggleAutomationRule,
  useDeleteAutomationRule,
} from "./hooks/useAutomation";
