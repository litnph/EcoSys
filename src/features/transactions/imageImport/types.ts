export interface ImageImportImage {
  id: string;
  file: File;
  previewUrl: string;
}

export interface ImageImportDraft {
  id: string;
  /** Ảnh nguồn mà dòng giao dịch được quét từ. */
  imageId: string;
  txnDate: string;
  description: string;
  amount: number;
  note: string;
  /** Giao dịch hoàn trả (+ trên sao kê) — không nhập riêng, thường hủy cặp chi tiêu trước đó. */
  isRefund: boolean;
  /** Danh mục chi cho dòng này (chỉ áp dụng giao dịch chi tiêu). */
  categoryId: string;
  selected: boolean;
}

export function newDraftId(): string {
  return `draft-${String(Date.now())}-${Math.random().toString(36).slice(2, 7)}`;
}

export function newImageId(): string {
  return `img-${String(Date.now())}-${Math.random().toString(36).slice(2, 7)}`;
}
