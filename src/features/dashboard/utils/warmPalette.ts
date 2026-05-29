/** Cyan / blue / violet tones for charts (modern tech palette). */
const CHART_HEX = [
  "#0891b2",
  "#06b6d4",
  "#22d3ee",
  "#2563eb",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#0ea5e9",
  "#14b8a6",
  "#10b981",
  "#0284c7",
  "#4f46e5",
] as const;

export function warmPaletteColor(index: number): string {
  return CHART_HEX[index % CHART_HEX.length] ?? CHART_HEX[0];
}
