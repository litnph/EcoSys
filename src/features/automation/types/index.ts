export interface AutomationRule {
  id: string;  name: string;
  triggerType: string;
  isActive: boolean;
  lastRunStatus: string | null;
  lastRunAt: string | null;
}
