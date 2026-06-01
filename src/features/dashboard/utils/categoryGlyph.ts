/** Small emoji heuristic from category/description for dashboard list flair. */
export function categoryGlyph(label: string | undefined): string {
  if (!label || label.trim().length === 0) return "💰";
  const mod = label
    .toLowerCase()
    .split("")
    .reduce((a, ch) => a + (ch.codePointAt(0) ?? 0), 0);
  const emojis = [
    "🍜",
    "🚗",
    "🏠",
    "☕",
    "📱",
    "🎯",
    "🎁",
    "✈️",
    "📚",
    "🎮",
    "🛒",
    "💡",
    "🐾",
    "🎵",
  ];
  return emojis[mod % emojis.length]!;
}
