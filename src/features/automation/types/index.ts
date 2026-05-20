export interface AutomationRule {
  id: string;
  smoduleId: string;
  name: string;
  triggerType: string;
  isActive: boolean;
  lastRunStatus: string | null;
  lastRunAt: string | null;
}
