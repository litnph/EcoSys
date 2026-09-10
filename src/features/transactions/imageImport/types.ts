export interface ImageImportImage {
  id: string;
  file: File;
  previewUrl: string;
}

export const IMAGE_IMPORT_KINDS = [
  "statement",
  "bank_transaction_list",
] as const;

export type ImageImportKind = (typeof IMAGE_IMPORT_KINDS)[number];
export type ImageImportDirection = "expense" | "income";
export type ImageImportReviewField =
  | "txnDate"
  | "description"
  | "amount"
  | "direction";

export interface ImageOcrLine {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

export interface ImageImportDraft {
  id: string;
  /** Ảnh nguồn mà dòng giao dịch được quét từ. */
  imageId: string;
  txnDate: string;
  description: string;
  amount: number;
  note: string;
  /** Income/expense direction extracted from the visible sign or edited in preview. */
  direction: ImageImportDirection;
  /** Giao dịch hoàn trả (+ trên sao kê) — không nhập riêng, thường hủy cặp chi tiêu trước đó. */
  isRefund: boolean;
  /** Category for the row, using the matching income/expense category kind. */
  categoryId: string;
  /** Multiple labels are supported by the existing transaction tag model. */
  tagIds: string[];
  /** OCR fields that should be explicitly checked in the existing preview. */
  reviewFields: ImageImportReviewField[];
  selected: boolean;
}

export function newDraftId(): string {
  return crypto.randomUUID();
}

export function newImageId(): string {
  return crypto.randomUUID();
}
