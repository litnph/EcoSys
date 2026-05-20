export interface Saving {
  id: string;  sourceId: string;
  sourceName: string;
  name: string;
  targetAmount: number | null;
  currentAmount: number;
  interestRate: number;
  startDate: string;
  maturityDate: string | null;
  type: string;
  status: string;
  note: string | null;
}

export type SavingDetail = Saving;
