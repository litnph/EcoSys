/**
 * Backend stores monetary amounts as whole currency units (e.g. VND đồng, no decimals).
 * Round before sending amounts in API request bodies or query strings.
 */
export function toApiWholeAmount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value);
}

export function toApiWholeAmountOrNull(
  value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value)) return null;
  return Math.round(value);
}
