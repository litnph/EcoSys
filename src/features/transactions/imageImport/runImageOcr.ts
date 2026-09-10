import { createWorker, PSM } from "tesseract.js";
import type { Block } from "tesseract.js";

import { preprocessImageForOcr } from "./preprocessImageForOcr";
import type { ImageOcrLine } from "./types";

export interface ImageOcrResult {
  text: string;
  numericText: string;
  lines: ImageOcrLine[];
  numericLines: ImageOcrLine[];
}

function flattenLines(blocks: Block[] | null, scale = 1): ImageOcrLine[] {
  return (blocks ?? []).flatMap((block) =>
    block.paragraphs.flatMap((paragraph) =>
      paragraph.lines.map((line) => ({
        text: line.text.trim(),
        confidence: line.confidence,
        bbox: {
          x0: line.bbox.x0 / scale,
          y0: line.bbox.y0 / scale,
          x1: line.bbox.x1 / scale,
          y1: line.bbox.y1 / scale,
        },
      })),
    ),
  );
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

    const { data } = await worker.recognize(
      preprocessed.image,
      {},
      { text: true, blocks: true },
    );

    // Chạy thêm một lượt trên ảnh gốc, chỉ nhận chữ số. Font số của một số
    // ứng dụng ngân hàng khiến OCR ngôn ngữ dễ nhầm 3 thành 5 sau khi làm nét.
    numericPass = true;
    await worker.reinitialize("eng");
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_COLUMN,
      preserve_interword_spaces: "1",
      tessedit_char_whitelist: "0123456789/.,+-",
    });

    const { data: numericData } = await worker.recognize(
      file,
      {},
      { text: true, blocks: true },
    );
    onProgress?.(1);

    return {
      text: data.text,
      numericText: numericData.text,
      lines: flattenLines(data.blocks, preprocessed.scale),
      numericLines: flattenLines(numericData.blocks),
    };
  } finally {
    await worker.terminate();
  }
}
