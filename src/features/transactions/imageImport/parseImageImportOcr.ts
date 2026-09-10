import { parseBankTransactionListOcr } from "./parseBankTransactionListOcr";
import { parseOcrTransactionText } from "./parseOcrTransactionText";
import type { ImageOcrResult } from "./runImageOcr";
import type { ImageImportDraft, ImageImportKind } from "./types";

export function parseImageImportOcr(
  result: ImageOcrResult,
  imageId: string,
  kind: ImageImportKind,
  referenceDate = new Date(),
): ImageImportDraft[] {
  if (kind === "bank_transaction_list") {
    return parseBankTransactionListOcr(result, imageId);
  }
  return parseOcrTransactionText(
    result.text,
    imageId,
    result.numericText,
    referenceDate,
  );
}
