export interface ImageImportImage {
  id: string;
  file: File;
  previewUrl: string;
}

export const IMAGE_IMPORT_KINDS = [
  "statement",
  "bank_transaction_list",
  "tp",
] as const;

export type ImageImportKind = (typeof IMAGE_IMPORT_KINDS)[number];

export const IMAGE_IMPORT_KIND_DEFINITIONS = [
  {
    type: "statement",
    labelKey: "statementKind",
    descriptionKey: "statementKindHelp",
    parser: "statement",
    requiresVnd: false,
  },
  {
    type: "bank_transaction_list",
    labelKey: "bankListKind",
    descriptionKey: "bankListKindHelp",
    parser: "bank_transaction_list",
    requiresVnd: true,
  },
  {
    type: "tp",
    labelKey: "tpKind",
    descriptionKey: "tpKindHelp",
    parser: "bank_transaction_list",
    requiresVnd: true,
  },
] as const satisfies ReadonlyArray<{
  type: ImageImportKind;
  labelKey: string;
  descriptionKey: string;
  parser: "statement" | "bank_transaction_list";
  requiresVnd: boolean;
}>;

export interface ImageImportTypeSetting {
  type: ImageImportKind;
  displayName: string;
  sourceId: string | null;
}

export function resolveImageImportTypeSettings(
  stored: readonly ImageImportTypeSetting[] | null | undefined,
  defaultName: (labelKey: string) => string,
): ImageImportTypeSetting[] {
  const byType = new Map(stored?.map((setting) => [setting.type, setting]));
  return IMAGE_IMPORT_KIND_DEFINITIONS.map((definition) => {
    const configured = byType.get(definition.type);
    return {
      type: definition.type,
      displayName: configured?.displayName.trim() || defaultName(definition.labelKey),
      sourceId: configured?.sourceId || null,
    };
  });
}

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

export function applyImageImportDescriptionPreference(
  drafts: readonly ImageImportDraft[],
  includeDescription: boolean,
): ImageImportDraft[] {
  if (includeDescription) return [...drafts];
  return drafts.map((draft) => ({
    ...draft,
    description: "",
    reviewFields: draft.reviewFields.filter((field) => field !== "description"),
  }));
}

export function newDraftId(): string {
  return crypto.randomUUID();
}

export function newImageId(): string {
  return crypto.randomUUID();
}
