/** Single-hue plus neutral chart palette for the financial register. */
const CHART_HEX = [
  "#725a3a",
  "#18181b",
  "#3f3f46",
  "#52525b",
  "#71717a",
  "#a1a1aa",
  "#27272a",
  "#d4d4d8",
  "#52525b",
  "#71717a",
  "#a1a1aa",
  "#3f3f46",
] as const;

export function warmPaletteColor(index: number): string {
  return CHART_HEX[index % CHART_HEX.length] ?? CHART_HEX[0];
}
