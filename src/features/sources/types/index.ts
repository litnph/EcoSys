/** Values serialized by ASP.NET <c>JsonStringEnumConverter</c> (camelCase). */
export type FinSourceType =
  | "cash"
  | "bankAccount"
  | "creditCard"
  | "eWallet"
  | "investment";

export interface FinSource {
  id: string;
  smoduleId: string;
  name: string;
  type: FinSourceType;
  balance: number;
  creditLimit: number | null;
  statementDay: number | null;
  paymentDueDay: number | null;
  minInstallmentAmt: number | null;
  currency: string;
  icon: string | null;
  color: string | null;
  sortOrder: number;
}

export interface CreateSourceRequest {
  smoduleId: string;
  name: string;
  type: FinSourceType;
  currency?: string | null;
  icon?: string | null;
  color?: string | null;
  creditLimit?: number | null;
  statementDay?: number | null;
  paymentDueDay?: number | null;
  minInstallmentAmt?: number | null;
  sortOrder?: number | null;
}

export interface UpdateSourceRequest {
  name: string;
  type: FinSourceType;
  currency?: string | null;
  icon?: string | null;
  color?: string | null;
  creditLimit?: number | null;
  statementDay?: number | null;
  paymentDueDay?: number | null;
  minInstallmentAmt?: number | null;
  sortOrder?: number | null;
}
