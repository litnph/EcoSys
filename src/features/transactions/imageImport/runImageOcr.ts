import { createWorker, PSM } from "tesseract.js";

import { preprocessImageForOcr } from "./preprocessImageForOcr";

export async function runImageOcr(
  file: File | Blob,
  onProgress?: (progress: number) => void,
): Promise<string> {
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
    const preprocessed = await preprocessImageForOcr(file);

    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_COLUMN,
      preserve_interword_spaces: "1",
    });

    const { data } = await worker.recognize(preprocessed);
    return data.text;
  } finally {
    await worker.terminate();
  }
}
