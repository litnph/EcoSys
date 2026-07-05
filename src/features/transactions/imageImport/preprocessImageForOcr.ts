/** Upscale + tăng tương phản để Tesseract đọc số trên ảnh chụp màn hình rõ hơn. */
export async function preprocessImageForOcr(
  file: File | Blob,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(3, Math.max(2, 1200 / bitmap.width));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  const contrast = 1.35;
  const intercept = 128 * (1 - contrast);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    const enhanced = Math.max(0, Math.min(255, gray * contrast + intercept));
    data[i] = enhanced;
    data[i + 1] = enhanced;
    data[i + 2] = enhanced;
  }

  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Không xử lý được ảnh."));
      },
      "image/png",
      1,
    );
  });
}
