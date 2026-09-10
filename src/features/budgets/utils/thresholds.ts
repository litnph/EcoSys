export function generateBudgetThresholds(count: number): number[] {
  if (!Number.isInteger(count) || count < 0 || count > 10) return [];
  return Array.from({ length: count }, (_, index) =>
    Number((((index + 1) * 100) / (count + 1)).toFixed(2)),
  );
}

export function validateBudgetThresholds(thresholds: number[], count: number): boolean {
  if (thresholds.length !== count) return false;
  return thresholds.every((value, index) =>
    Number.isFinite(value)
    && value > 0
    && value < 100
    && (index === 0 || value > thresholds[index - 1]),
  );
}
