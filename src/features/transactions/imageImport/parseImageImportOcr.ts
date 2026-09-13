import { parseBankTransactionListOcr } from "./parseBankTransactionListOcr";
import { parseOcrTransactionText } from "./parseOcrTransactionText";
import type { ImageOcrResult } from "./runImageOcr";
import { IMAGE_IMPORT_KIND_DEFINITIONS } from "./types";
import type { ImageImportDraft, ImageImportKind } from "./types";

export function parseImageImportOcr(
  result: ImageOcrResult,
  imageId: string,
  kind: ImageImportKind,
  referenceDate = new Date(),
): ImageImportDraft[] {
  const definition = IMAGE_IMPORT_KIND_DEFINITIONS.find((entry) => entry.type === kind);
  if (definition?.parser === "bank_transaction_list") {
    return parseBankTransactionListOcr(result, imageId);
  }
  return parseOcrTransactionText(
    result.text,
    imageId,
    result.numericText,
    referenceDate,
  );
}
