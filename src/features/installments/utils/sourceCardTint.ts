export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.trim().replace("#", "");
  if (h.length !== 6 || alpha < 0 || alpha > 1) {
    return `rgba(0,0,0,${String(alpha)})`;
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${String(r)},${String(g)},${String(b)},${String(alpha)})`;
}

export function sourceCardTintColor(
  color: string | null | undefined,
): string {
  if (color && /^#[0-9a-fA-F]{6}$/.test(color)) {
    return hexToRgba(color, 0.12);
  }
  return "rgba(8, 145, 178, 0.08)";
}
