import type { ImageImportDraft } from "./types";

import { newDraftId } from "./types";

const DATE_IN_LINE =
  /(\d{1,2})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*(\d{2,4})/;

const SKIP_LINE =
  /lịch\s*sử|thẻ\s*tín\s*dụng|tìm\s*kiếm|transaction\s*history|credit\s*card|giao\s*dịch\s*thanh\s*toán|purchase|card\s*no|số\s*thẻ|so\s*the/i;

const REFUND_HINT =
  /hoan\s*tra|hoàn\s*trả|revert|giao\s*dich\s*hoan/i;

/** Số tiền ở cuối dòng: `- 20,000`, `+ 69,000`, `-170,233`. */
const AMOUNT_TAIL =
  /(?:^|\s)([-+−–])?\s*([\dOoIlSsBbZzG]{1,3}(?:[.,\s][\dOoIlSsBbZzG]{3})*(?:[.,][\dOoIlSsBbZzG]+)?)\s*$/;

/** Dòng chỉ có số tiền (merchant nằm dòng trên trong ảnh sao kê). */
const AMOUNT_ONLY =
  /^\s*([-+−–])?\s*([\dOoIlSsBbZzG]{1,3}(?:[.,\s][\dOoIlSsBbZzG]{3})*(?:[.,][\dOoIlSsBbZzG]+)?)\s*$/;

function normalizeOcrLine(raw: string): string {
  return raw.replace(/\|/g, "I").replace(/[ \t]+/g, " ").trim();
}

/** Sửa ký tự hay bị OCR nhầm trong chuỗi số. */
function normalizeOcrDigits(raw: string): string {
  let s = raw
    .replace(/[OoQ]/g, "0")
    .replace(/[Il|]/g, "1")
    .replace(/[Zz]/g, "2")
    .replace(/[Ee]/g, "3");

  // S giữa các chữ số thường là 3 bị OCR nhầm (vd: 7S,000 → 73,000).
  s = s.replace(/(?<=\d)[Ss](?=\d)/g, "3");

  return s
    .replace(/[Ss$]/g, "5")
    .replace(/[Bb]/g, "8")
    .replace(/[G]/g, "6");
}

function formatIsoDate(day: string, month: string, yearRaw: string): string | null {
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const year =
    yearRaw.length === 2
      ? 2000 + parseInt(yearRaw, 10)
      : parseInt(yearRaw, 10);

  if (
    !Number.isFinite(dayNum) ||
    !Number.isFinite(monthNum) ||
    !Number.isFinite(year) ||
    dayNum < 1 ||
    dayNum > 31 ||
    monthNum < 1 ||
    monthNum > 12 ||
    year < 2000 ||
    year > 2100
  ) {
    return null;
  }

  return `${String(year)}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function extractDateFromLine(line: string): string | null {
  const normalized = normalizeOcrDigits(line);
  const m = normalized.match(DATE_IN_LINE);
  if (!m) return null;

  const rest = normalized
    .slice((m.index ?? 0) + m[0].length)
    .replace(/^\s*[:-]?\s*/, "");
  if (rest.length > 0 && /\d/.test(rest) && !SKIP_LINE.test(line)) {
    return null;
  }

  return formatIsoDate(m[1], m[2], m[3]);
}

function parseVndAmount(raw: string): number | null {
  const cleaned = normalizeOcrDigits(raw)
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(/,/g, "");

  if (!/^\d+$/.test(cleaned)) return null;

  const n = parseInt(cleaned, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function isRefundText(...parts: Array<string | undefined>): boolean {
  return parts.some((p) => p && REFUND_HINT.test(p));
}

function parseTxnLine(
  line: string,
): { description: string; amount: number; isRefund: boolean } | null {
  const trimmed = line.trim();
  if (!trimmed || SKIP_LINE.test(trimmed)) return null;

  const amountMatch = trimmed.match(AMOUNT_TAIL);
  if (!amountMatch) return null;

  const amount = parseVndAmount(amountMatch[2]);
  if (amount === null) return null;

  const sign = amountMatch[1]?.replace(/−|–/g, "-") ?? "";
  const isRefund = sign === "+" || isRefundText(trimmed);

  const description = trimmed
    .slice(0, trimmed.length - amountMatch[0].length)
    .replace(/\s*[-+]\s*$/, "")
    .trim();

  if (description.length < 2) return null;
  if (SKIP_LINE.test(description)) return null;

  return { description, amount, isRefund };
}

function parseAmountOnlyLine(
  line: string,
): { amount: number; isRefund: boolean } | null {
  const trimmed = line.trim();
  const m = trimmed.match(AMOUNT_ONLY);
  if (!m) return null;

  const amount = parseVndAmount(m[2]);
  if (amount === null) return null;

  const sign = m[1]?.replace(/−|–/g, "-") ?? "";
  return { amount, isRefund: sign === "+" };
}

function shouldUseAsNote(line: string): boolean {
  return SKIP_LINE.test(line) && line.length > 8;
}

function isLikelyMerchantLine(line: string): boolean {
  if (!line || SKIP_LINE.test(line)) return false;
  if (extractDateFromLine(line)) return false;
  if (parseAmountOnlyLine(line)) return false;
  if (parseTxnLine(line)) return false;
  return line.length >= 2;
}

type DateMarker = { index: number; date: string };

function findDateMarkers(lines: string[]): DateMarker[] {
  const markers: DateMarker[] = [];
  for (let i = 0; i < lines.length; i++) {
    const date = extractDateFromLine(lines[i]);
    if (date) markers.push({ index: i, date });
  }
  return markers;
}

function resolveDateForLine(
  lineIndex: number,
  markers: DateMarker[],
): string | null {
  if (markers.length === 0) return null;

  let resolved: string | null = null;
  for (const marker of markers) {
    if (marker.index <= lineIndex) resolved = marker.date;
    else break;
  }
  return resolved;
}

function pushDraft(
  drafts: ImageImportDraft[],
  imageId: string,
  txnDate: string,
  description: string,
  amount: number,
  isRefund: boolean,
  note: string,
) {
  drafts.push({
    id: newDraftId(),
    imageId,
    txnDate,
    description,
    amount,
    note,
    isRefund,
    categoryId: "",
    selected: !isRefund,
  });
}

/** Ghép hoàn trả với chi tiêu cùng số tiền gần nhất — bỏ chọn cả hai (net = 0). */
function applyRefundPairing(drafts: ImageImportDraft[]): ImageImportDraft[] {
  const result = drafts.map((d) => ({ ...d }));

  for (let i = 0; i < result.length; i++) {
    const refund = result[i];
    if (!refund.isRefund) continue;

    for (let j = i - 1; j >= 0 && j >= i - 8; j--) {
      const expense = result[j];
      if (expense.isRefund || expense.amount !== refund.amount) continue;

      refund.selected = false;
      expense.selected = false;
      refund.note = refund.note
        ? `${refund.note} · Đã ghép với chi tiêu cùng số tiền`
        : "Hoàn trả — đã ghép với chi tiêu cùng số tiền phía trên";
      expense.note = expense.note
        ? `${expense.note} · Đã hủy do hoàn trả`
        : "Chi tiêu đã hủy — có hoàn trả cùng số tiền phía dưới";
      break;
    }
  }

  return result;
}

/**
 * Trích danh sách giao dịch từ text OCR (ảnh sao kê / lịch sử thẻ).
 * Gom theo tiêu đề ngày DD/MM/YYYY; hỗ trợ merchant và số tiền tách dòng.
 */
export function parseOcrTransactionText(
  text: string,
  imageId = "",
): ImageImportDraft[] {
  const lines = text
    .split(/\r?\n/)
    .map(normalizeOcrLine)
    .filter((l) => l.length > 0);

  const dateMarkers = findDateMarkers(lines);
  const drafts: ImageImportDraft[] = [];
  let pendingMerchant: string | undefined;
  let pendingNote: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (extractDateFromLine(line)) {
      pendingMerchant = undefined;
      pendingNote = undefined;
      continue;
    }

    const txnDate = resolveDateForLine(i, dateMarkers);
    if (!txnDate) continue;

    const inlineTxn = parseTxnLine(line);
    if (inlineTxn) {
      const noteRefund = isRefundText(pendingNote);
      pushDraft(
        drafts,
        imageId,
        txnDate,
        inlineTxn.description,
        inlineTxn.amount,
        inlineTxn.isRefund || noteRefund,
        pendingNote ?? "",
      );
      pendingMerchant = undefined;
      pendingNote = undefined;
      continue;
    }

    const amountOnly = parseAmountOnlyLine(line);
    if (amountOnly && pendingMerchant) {
      const noteRefund = isRefundText(pendingNote, pendingMerchant);
      pushDraft(
        drafts,
        imageId,
        txnDate,
        pendingMerchant,
        amountOnly.amount,
        amountOnly.isRefund || noteRefund,
        pendingNote ?? "",
      );
      pendingMerchant = undefined;
      pendingNote = undefined;
      continue;
    }

    if (shouldUseAsNote(line)) {
      pendingNote = line;
      continue;
    }

    if (isLikelyMerchantLine(line)) {
      pendingMerchant = line;
      pendingNote = undefined;
    }
  }

  return applyRefundPairing(drafts);
}
