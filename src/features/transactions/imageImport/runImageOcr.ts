import { createWorker } from "tesseract.js";

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
    const { data } = await worker.recognize(file);
    return data.text;
  } finally {
    await worker.terminate();
  }
}
