export interface Investment {
  id: string;
  smoduleId: string;
  name: string;
  type: string;
  currentValue: number;
  totalInvested: number;
  totalReturned: number;
  currency: string;
  note: string | null;
  profitLoss: number;
}
