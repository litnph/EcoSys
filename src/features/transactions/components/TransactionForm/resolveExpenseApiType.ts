import type { FinSource } from "@/features/sources/types";

import type { CreateTransactionBody } from "../../api/transactionsApi";

/** Chi tiêu form → `direct` (tiền mặt/ví/TK) hoặc `deferred` (thẻ tín dụng). */
export function resolveExpenseApiType(
  sourceId: string,
  sources: FinSource[]): CreateTransactionBody["type"] {
  const src = sources.find((s) => s.id === sourceId.trim());
  return src?.type === "creditCard" ? "deferred" : "direct";
}

export function isCreditCardExpenseSource(
  sourceId: string,
  sources: FinSource[]): boolean {
  return resolveExpenseApiType(sourceId, sources) === "deferred";
}
