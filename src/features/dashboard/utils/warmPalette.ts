/** Distinct warm tones for charts (amber / terracotta / rose). */
const WARM_HEX = [
  "#c2410c",
  "#ea580c",
  "#f97316",
  "#fb923c",
  "#fdba74",
  "#d97706",
  "#b45309",
  "#9a3412",
  "#f87171",
  "#fb7185",
  "#f59e0b",
  "#78350f",
] as const;

export function warmPaletteColor(index: number): string {
  return WARM_HEX[index % WARM_HEX.length] ?? WARM_HEX[0];
}
