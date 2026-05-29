/** Splits principal: standard round to unit for most periods; last period gets the remainder. */
export function splitInstallmentSchedule(
  total: number,
  months: number,
): { monthlyShare: number; lastShare: number } {
  if (months < 1) return { monthlyShare: 0, lastShare: 0 };
  if (months === 1) return { monthlyShare: total, lastShare: total };
  const monthlyShare = Math.round(total / months);
  const lastShare = total - monthlyShare * (months - 1);
  return { monthlyShare, lastShare };
}
