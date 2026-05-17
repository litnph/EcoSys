import type { LucideIcon } from "lucide-react";
import {
  CreditCard,
  Landmark,
  Smartphone,
  Wallet,
} from "lucide-react";

/** Normalise API enum casing (camelCase vs snake_case). */
export function normalizeEnumKey(raw: string): string {
  return raw
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .trim();
}

export function isIncomeTxnType(type: string): boolean {
  return normalizeEnumKey(type) === "income";
}

/** Icon for finance/source type strings from backend. */
export function sourceTypeIcon(type: string): LucideIcon {
  const k = normalizeEnumKey(type).replace(/\s+/g, "");
  if (
    k.includes("credit") ||
    k.includes("creditcard")
  )
    return CreditCard;
  if (
    k.includes("bank") ||
    k.includes("account")
  )
    return Landmark;
  if (
    k.includes("ewallet") ||
    k.includes("e_wallet") ||
    k.includes("wallet")
  )
    return Smartphone;
  return Wallet;
}
