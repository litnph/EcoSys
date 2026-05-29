import type { FinSourceType } from "../types";

export function supportsBalanceLedger(type: FinSourceType): boolean {
  return type !== "creditCard";
}
