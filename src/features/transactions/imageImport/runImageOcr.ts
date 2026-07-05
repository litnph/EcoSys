import { createWorker } from "tesseract.js";

import {
  preprocessOcrText,
  rebuildTextFromSymbols,
} from "./fixOcrText";
import { preprocessImageForOcr } from "./preprocessImageForOcr";

export async function runImageOcr(
  file: File | Blob,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const preprocessed = await preprocessImageForOcr(file);

  const worker = await createWorker("vie+eng", 1, {
    logger: (message) => {
      if (
        message.status === "recognizing text" &&
        typeof message.progress === "number"
      ) {
        onProgress?.(message.progress);
      }
    },
  });

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: "4",
    });

    const { data } = await worker.recognize(preprocessed);

    let text = data.text;
    if (data.symbols && data.symbols.length > 0) {
      text = rebuildTextFromSymbols(
        data.symbols.map((symbol) => ({
          text: symbol.text,
          confidence: symbol.confidence,
        })),
      );
    }

    return preprocessOcrText(text);
  } finally {
    await worker.terminate();
  }
}
