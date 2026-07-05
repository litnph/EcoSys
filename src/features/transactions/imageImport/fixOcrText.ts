const DATE_TOKEN =
  /(\d{1,2}\s*[\/.\-]\s*\d{1,2}\s*[\/.\-]\s*\d{4})/g;

/** Chuẩn hoá ký tự hay bị OCR nhầm trong chuỗi số / ngày. */
export function normalizeOcrNumerals(value: string): string {
  return value
    .replace(/[|!]/g, "1")
    .replace(/[Il]/g, "1")
    .replace(/[OoQ]/g, "0")
    .replace(/[Ss\$]/g, "5")
    .replace(/[Bb]/g, "8")
    .replace(/[Zz]/g, "2");
}

/**
 * Tách dòng OCR bị dính: "... - 225,68021/06/2026 MPGS..."
 * thành nhiều dòng để parser nhận đủ nhiều ngày.
 */
export function preprocessOcrText(text: string): string {
  let normalized = text.replace(/\r/g, "");

  normalized = normalized.replace(
    /([^\n\d])(\d{1,2}\s*[\/.\-]\s*\d{1,2}\s*[\/.\-]\s*\d{4})/g,
    "$1\n$2",
  );

  normalized = normalized.replace(
    /(\d{1,2}\s*[\/.\-]\s*\d{1,2}\s*[\/.\-]\s*\d{4})([^\s\n\/.\-0-9])/g,
    "$1\n$2",
  );

  normalized = normalized.replace(
    /(\d)([+\-−–]\s*\d[\d,.\s]{2,})/g,
    "$1\n$2",
  );

  return normalized;
}

/** Sửa 5 → 3 trong chuỗi số tiền (Tesseract hay nhầm trên font app ngân hàng). */
export function fixAmountOcrDigits(raw: string): string {
  const normalized = normalizeOcrNumerals(raw);

  return normalized.replace(
    /(\d)5(\d{3}\b)/g,
    (match, before: string, after: string) => {
      const corrected = `${before}3${after}`;
      const originalNum = parseInt(match.replace(/\D/g, ""), 10);
      const correctedNum = parseInt(corrected.replace(/\D/g, ""), 10);
      if (!Number.isFinite(originalNum) || !Number.isFinite(correctedNum)) {
        return match;
      }
      if (correctedNum <= 0) return match;
      return corrected;
    },
  );
}

export function fixLineAmounts(line: string): string {
  return line.replace(
    /([+\-−–]?\s*\d[\d,.\s]{1,})/g,
    (segment) => fixAmountOcrDigits(segment),
  );
}

export function expandLineSegments(line: string): string[] {
  const normalized = normalizeOcrNumerals(line.trim());
  if (!normalized) return [];

  const segments: string[] = [];
  let lastIndex = 0;

  for (const match of normalized.matchAll(DATE_TOKEN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      const before = fixLineAmounts(normalized.slice(lastIndex, index).trim());
      if (before) segments.push(before);
    }
    segments.push(match[1].trim());
    lastIndex = index + match[0].length;
  }

  if (lastIndex < normalized.length) {
    const tail = fixLineAmounts(normalized.slice(lastIndex).trim());
    if (tail) segments.push(tail);
  }

  return segments.length > 0 ? segments : [fixLineAmounts(normalized)];
}

/** Ghép lại text từ symbol Tesseract, sửa '5' confidence thấp trong số. */
export function rebuildTextFromSymbols(
  symbols: Array<{ text: string; confidence: number }>,
): string {
  let out = "";

  for (const symbol of symbols) {
    let char = symbol.text;
    if (
      char === "5" &&
      symbol.confidence < 82 &&
      out.length > 0 &&
      /\d/.test(out[out.length - 1] ?? "")
    ) {
      char = "3";
    }
    out += char;
  }

  return out;
}
