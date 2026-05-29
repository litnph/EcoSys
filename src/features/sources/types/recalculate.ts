import type { FinSourceType } from "./index";

export interface SourceRecalculatePreviewItem {
  sourceId: string;
  name: string;
  type: FinSourceType;
  currency: string;
  storedBalance: number;
  computedBalance: number;
  drift: number;
  creditLimit: number | null;
  storedUtilizationPercent: number | null;
  computedUtilizationPercent: number | null;
}

export interface ApplySourcesRecalculateResult {
  sourceId: string;
  previousBalance: number;
  newBalance: number;
  applied: boolean;
}
