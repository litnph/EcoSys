/** Values serialized by ASP.NET <c>JsonStringEnumConverter</c> (camelCase). */
export type FinSourceType =
  | "cash"
  | "bankAccount"
  | "creditCard"
  | "eWallet"
  | "investment";

export interface FinSource {
  id: string;  name: string;
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
  /** Dư nợ trả góp còn lại (active plans) — chỉ có ý nghĩa với thẻ tín dụng. */
  installmentRemainingAmount?: number;
  version: number;
}

export interface CreateSourceRequest {  name: string;
  type: FinSourceType;
  currency?: string | null;
  icon?: string | null;
  color?: string | null;
  creditLimit?: number | null;
  statementDay?: number | null;
  paymentDueDay?: number | null;
  minInstallmentAmt?: number | null;
  sortOrder?: number | null;
  /** Số dư ban đầu (chỉ khi tạo, nguồn không phải thẻ). */
  initialBalance?: number | null;
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
  expectedVersion?: number | null;
}
