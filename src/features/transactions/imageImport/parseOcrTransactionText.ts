import type { ImageImportDraft } from "./types";
import { newDraftId } from "./types";

const DATE_HEADER =
  /^(\d{1,2})\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{4})$/;

const SKIP_LINE =
  /lịch\s*sử|thẻ\s*tín\s*dụng|tìm\s*kiếm|transaction\s*history|credit\s*card|giao\s*dịch\s*thanh\s*toán|purchase|card\s*no|số\s*thẻ|so\s*the/i;

const REFUND_HINT =
  /hoan\s*tra|hoàn\s*trả|revert|giao\s*dich\s*hoan/i;

/** Số tiền ở cuối dòng: `- 20,000`, `+ 69,000`, `-170,233`. */
const AMOUNT_TAIL =
  /(?:^|\s)([+\-−–])?\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d+)?)\s*$/;

function normalizeOcrLine(raw: string): string {
  return raw
    .replace(/\|/g, "I")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function parseDateHeader(line: string): string | null {
  const m = line.match(DATE_HEADER);
  if (!m) return null;
  const day = m[1].padStart(2, "0");
  const month = m[2].padStart(2, "0");
  const year = m[3];
  return `${year}-${month}-${day}`;
}

function parseVndAmount(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, "").replace(/\./g, "").replace(/,/g, "");
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

function shouldUseAsNote(line: string): boolean {
  return SKIP_LINE.test(line) && line.length > 8;
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
 * Gom theo tiêu đề ngày DD/MM/YYYY; bỏ dòng mô tả phụ ngân hàng.
 * Dòng có dấu + hoặc mô tả hoàn trả được đánh dấu isRefund.
 */
export function parseOcrTransactionText(text: string): ImageImportDraft[] {
  const lines = text
    .split(/\r?\n/)
    .map(normalizeOcrLine)
    .filter((l) => l.length > 0);

  const drafts: ImageImportDraft[] = [];
  let currentDate: string | null = null;
  let pendingNote: string | undefined;

  for (const line of lines) {
    const date = parseDateHeader(line);
    if (date) {
      currentDate = date;
      pendingNote = undefined;
      continue;
    }

    if (!currentDate) continue;

    const txn = parseTxnLine(line);
    if (txn) {
      const noteRefund = isRefundText(pendingNote);
      const isRefund = txn.isRefund || noteRefund;

      drafts.push({
        id: newDraftId(),
        txnDate: currentDate,
        description: txn.description,
        amount: txn.amount,
        note: pendingNote ?? "",
        isRefund,
        categoryId: "",
        selected: !isRefund,
      });
      pendingNote = undefined;
      continue;
    }

    if (shouldUseAsNote(line)) {
      pendingNote = line;
    }
  }

  return applyRefundPairing(drafts);
}
