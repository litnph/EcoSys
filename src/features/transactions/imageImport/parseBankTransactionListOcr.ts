import type { ImageOcrResult } from "./runImageOcr";
import type {
  ImageImportDirection,
  ImageImportDraft,
  ImageImportReviewField,
  ImageOcrLine,
} from "./types";
import { newDraftId } from "./types";

const DATE_LINE =
  /^\s*([\dOoIl]{1,2})\s*[/.−-]\s*([\dOoIl]{1,2})\s*[/.−-]\s*([\dOoIl]{2,4})\s*$/;
const SIGNED_AMOUNT_TAIL =
  /(?:^|[\s:])~?\s*([+−–-])\s*([\dOoIlSsBbZzG]{1,3}(?:[.,/\s][\dOoIlSsBbZzG]{3})+|[\dOoIlSsBbZzG]{1,12})\s*(?:VND)?\s*$/i;
const NUMERIC_AMOUNT_TAIL =
  /(?:^|\s)([+−–-])?\s*([\dOoIlSsBbZzG]{1,3}(?:[.,/\s][\dOoIlSsBbZzG]{3})+)\s*$/;
const UI_CHROME =
  /tài\s*khoản\s*thanh\s*toán|payment\s*account|transaction\s*history|lịch\s*sử\s*giao\s*dịch/i;

type DateMarker = {
  index: number;
  line: ImageOcrLine;
  date: string;
  uncertain: boolean;
};

type AmountCandidate = {
  index: number;
  line: ImageOcrLine;
  amount: number;
  sign: "+" | "-" | null;
  prefix: string;
};

type OcrBlock = {
  date: string;
  dateUncertain: boolean;
  hasDateMarker: boolean;
  lines: Array<{ index: number; line: ImageOcrLine }>;
  yStart: number;
  yEnd: number;
};

function normalizeWhitespace(raw: string): string {
  return raw.replace(/\|/g, "I").replace(/[ \t]+/g, " ").trim();
}

function normalizeOcrDigits(raw: string): string {
  let value = raw
    .replace(/[OoQ]/g, "0")
    .replace(/[Il|]/g, "1")
    .replace(/[Zz]/g, "2")
    .replace(/[Ee]/g, "3");
  value = value.replace(/(?<=\d)[Ss](?=\d)/g, "3");
  return value
    .replace(/[Ss$]/g, "5")
    .replace(/[Bb]/g, "8")
    .replace(/[G]/g, "6");
}

function parsePositiveVnd(raw: string): number | null {
  const digits = normalizeOcrDigits(raw).replace(/[.,/\s]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  const amount = Number.parseInt(digits, 10);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}

function isoDate(dayRaw: string, monthRaw: string, yearRaw: string): string | null {
  const day = Number.parseInt(normalizeOcrDigits(dayRaw), 10);
  const month = Number.parseInt(normalizeOcrDigits(monthRaw), 10);
  const normalizedYear = normalizeOcrDigits(yearRaw);
  const year = normalizedYear.length === 2
    ? 2000 + Number.parseInt(normalizedYear, 10)
    : Number.parseInt(normalizedYear, 10);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (
    !Number.isFinite(day) ||
    !Number.isFinite(month) ||
    !Number.isFinite(year) ||
    year < 2000 ||
    year > 2100 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > lastDay
  ) {
    return null;
  }
  return `${String(year)}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseDateMarker(line: ImageOcrLine, index: number): DateMarker | null {
  const match = normalizeWhitespace(line.text).match(DATE_LINE);
  if (!match) return null;
  const date = isoDate(match[1], match[2], match[3]);
  return {
    index,
    line,
    date: date ?? "",
    uncertain: date === null || line.confidence < 55,
  };
}

function normalizedSign(raw: string | undefined): "+" | "-" | null {
  if (raw === "+") return "+";
  if (raw && /[-−–]/.test(raw)) return "-";
  return null;
}

function signedCandidate(line: ImageOcrLine, index: number): AmountCandidate | null {
  const text = normalizeWhitespace(line.text);
  const match = text.match(SIGNED_AMOUNT_TAIL);
  if (!match) return null;
  if (!/[.,/\s]/.test(match[2]) && !/VND\s*$/i.test(text)) return null;
  const amount = parsePositiveVnd(match[2]);
  if (amount === null) return null;
  const prefix = text.slice(0, match.index).replace(/^[\s:]+|[\s:]+$/g, "");
  return {
    index,
    line,
    amount,
    sign: normalizedSign(match[1]),
    prefix,
  };
}

function numericCandidate(line: ImageOcrLine, index: number): AmountCandidate | null {
  const text = normalizeWhitespace(line.text);
  const match = text.match(NUMERIC_AMOUNT_TAIL);
  if (!match) return null;
  const amount = parsePositiveVnd(match[2]);
  if (amount === null) return null;
  return {
    index,
    line,
    amount,
    sign: normalizedSign(match[1]),
    prefix: "",
  };
}

function lineCenter(line: ImageOcrLine): number {
  return line.bbox.y1 > line.bbox.y0
    ? (line.bbox.y0 + line.bbox.y1) / 2
    : line.bbox.y0;
}

function fallbackLines(text: string): ImageOcrLine[] {
  return text
    .split(/\r?\n/)
    .map(normalizeWhitespace)
    .filter(Boolean)
    .map((line, index) => ({
      text: line,
      confidence: 100,
      bbox: { x0: 0, y0: index, x1: 0, y1: index },
    }));
}

function makeBlocks(lines: ImageOcrLine[]): OcrBlock[] {
  const markers = lines
    .map((line, index) => parseDateMarker(line, index))
    .filter((marker): marker is DateMarker => marker !== null);

  if (markers.length === 0) {
    return [{
      date: "",
      dateUncertain: true,
      hasDateMarker: false,
      lines: lines.map((line, index) => ({ index, line })),
      yStart: Number.NEGATIVE_INFINITY,
      yEnd: Number.POSITIVE_INFINITY,
    }];
  }

  return markers.map((marker, markerIndex) => {
    const next = markers[markerIndex + 1];
    return {
      date: marker.date,
      dateUncertain: marker.uncertain,
      hasDateMarker: true,
      lines: lines
        .map((line, index) => ({ index, line }))
        .filter(({ index }) => index > marker.index && (!next || index < next.index)),
      yStart: marker.line.bbox.y0,
      yEnd: next?.line.bbox.y0 ?? Number.POSITIVE_INFINITY,
    };
  });
}

function isDescriptionLine(text: string): boolean {
  const normalized = normalizeWhitespace(text);
  if (!normalized || UI_CHROME.test(normalized)) return false;
  if (/^[<>›»]+$/.test(normalized)) return false;
  return !DATE_LINE.test(normalized);
}

function nearestNumericAmount(
  candidate: AmountCandidate,
  numericCandidates: AmountCandidate[],
): AmountCandidate | null {
  if (numericCandidates.length === 0) return null;
  const targetY = lineCenter(candidate.line);
  return [...numericCandidates].sort((left, right) => {
    const leftSignPenalty = left.sign && left.sign !== candidate.sign ? 10_000 : 0;
    const rightSignPenalty = right.sign && right.sign !== candidate.sign ? 10_000 : 0;
    return Math.abs(lineCenter(left.line) - targetY) + leftSignPenalty
      - (Math.abs(lineCenter(right.line) - targetY) + rightSignPenalty);
  })[0] ?? null;
}

function uniqueReviewFields(fields: ImageImportReviewField[]): ImageImportReviewField[] {
  return [...new Set(fields)];
}

function draftsFromBlock(
  block: OcrBlock,
  numericLines: ImageOcrLine[],
  imageId: string,
): ImageImportDraft[] {
  const visibleAmountCandidates = block.lines
    .map(({ line, index }) => signedCandidate(line, index))
    .filter((candidate): candidate is AmountCandidate => candidate !== null);
  const numericCandidates = numericLines
    .map((line, index) => numericCandidate(line, index))
    .filter((candidate): candidate is AmountCandidate => candidate !== null)
    .filter((candidate) => {
      const y = lineCenter(candidate.line);
      return y >= block.yStart && y < block.yEnd;
    });
  const amountCandidates = visibleAmountCandidates.length > 0
    ? visibleAmountCandidates
    : numericCandidates.filter((candidate) => candidate.sign !== null);

  const descriptionParts = block.lines.flatMap(({ line, index }) => {
    const amount = signedCandidate(line, index);
    const text = amount ? amount.prefix : normalizeWhitespace(line.text);
    return isDescriptionLine(text) && text
      ? [{ index, line, text }]
      : [];
  });

  if (amountCandidates.length === 0) {
    const description = descriptionParts.map((part) => part.text).join(" ").trim();
    if (!block.hasDateMarker || (!description && !block.date)) return [];
    return [{
      id: newDraftId(),
      imageId,
      txnDate: block.date,
      description,
      amount: 0,
      note: "",
      direction: "expense",
      isRefund: false,
      categoryId: "",
      tagIds: [],
      reviewFields: uniqueReviewFields([
        ...(block.dateUncertain ? ["txnDate" as const] : []),
        ...(!description ? ["description" as const] : []),
        "amount",
        "direction",
      ]),
      selected: true,
    }];
  }

  return amountCandidates.map((candidate, candidateIndex) => {
    const closestNumeric = nearestNumericAmount(candidate, numericCandidates);
    const direction: ImageImportDirection = candidate.sign === "+" ? "income" : "expense";
    const assignedParts = descriptionParts
      .filter((part) => {
        const partY = lineCenter(part.line);
        const distance = Math.abs(partY - lineCenter(candidate.line));
        return amountCandidates.every((other, otherIndex) =>
          otherIndex === candidateIndex || distance <= Math.abs(partY - lineCenter(other.line)),
        );
      })
      .sort((left, right) => left.index - right.index);
    const description = assignedParts.map((part) => part.text).join(" ").trim();
    const confidenceValues = assignedParts.map((part) => part.line.confidence);
    const descriptionConfidence = confidenceValues.length > 0
      ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length
      : 0;
    const directionConflict = closestNumeric?.sign != null
      && closestNumeric.sign !== candidate.sign;
    const reviewFields: ImageImportReviewField[] = [
      ...(block.dateUncertain || (candidateIndex > 0 && amountCandidates.length > 1)
        ? ["txnDate" as const]
        : []),
      ...(!description || descriptionConfidence < 35
        ? ["description" as const]
        : []),
      ...(candidate.line.confidence < 35 || directionConflict
        ? ["amount" as const]
        : []),
      ...(candidate.sign === null || directionConflict
        ? ["direction" as const]
        : []),
    ];

    return {
      id: newDraftId(),
      imageId,
      txnDate: candidateIndex === 0 ? block.date : "",
      description,
      amount: closestNumeric?.amount ?? candidate.amount,
      note: "",
      direction,
      isRefund: false,
      categoryId: "",
      tagIds: [],
      reviewFields: uniqueReviewFields(reviewFields),
      selected: true,
    };
  });
}

/**
 * Parses a mobile bank transaction list. Each visible date starts a transaction
 * boundary; wrapped description rows are assigned to the closest signed amount.
 * A second, numeric-only OCR pass corrects digits without overriding the visible sign.
 */
export function parseBankTransactionListOcr(
  result: ImageOcrResult,
  imageId = "",
): ImageImportDraft[] {
  const lines = result.lines.length > 0 ? result.lines : fallbackLines(result.text);
  const numericLines = result.numericLines.length > 0
    ? result.numericLines
    : fallbackLines(result.numericText);
  return makeBlocks(lines).flatMap((block) =>
    draftsFromBlock(block, numericLines, imageId),
  );
}
