import { createWorker, PSM } from "tesseract.js";

import { preprocessImageForOcr } from "./preprocessImageForOcr";

export interface ImageOcrResult {
  text: string;
  numericText: string;
}

export async function runImageOcr(
  file: File | Blob,
  onProgress?: (progress: number) => void,
): Promise<ImageOcrResult> {
  let numericPass = false;
  const worker = await createWorker("vie+eng", 1, {
    logger: (message) => {
      if (
        message.status === "recognizing text" &&
        typeof message.progress === "number"
      ) {
        onProgress?.(
          numericPass
            ? 0.7 + message.progress * 0.3
            : message.progress * 0.7,
        );
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

    // Chạy thêm một lượt trên ảnh gốc, chỉ nhận chữ số. Font số của một số
    // ứng dụng ngân hàng khiến OCR ngôn ngữ dễ nhầm 3 thành 5 sau khi làm nét.
    numericPass = true;
    await worker.reinitialize("eng");
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_COLUMN,
      preserve_interword_spaces: "1",
      tessedit_char_whitelist: "0123456789/.,+-",
    });

    const { data: numericData } = await worker.recognize(file);
    onProgress?.(1);

    return { text: data.text, numericText: numericData.text };
  } finally {
    await worker.terminate();
  }
}
