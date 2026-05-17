import type { FinSourceType } from "../types";

const TYPE_LABEL_VI: Record<FinSourceType, string> = {
  cash: "Tiền mặt",
  bankAccount: "Ngân hàng",
  creditCard: "Thẻ tín dụng",
  eWallet: "Ví điện tử",
  investment: "Đầu tư",
};

export function sourceTypeLabelVi(type: FinSourceType): string {
  return TYPE_LABEL_VI[type] ?? type;
}
