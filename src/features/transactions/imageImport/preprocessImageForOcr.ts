/** Upscale + tăng tương phản để OCR nhận số (đặc biệt 3/5) chính xác hơn trên ảnh chụp màn hình. */
export async function preprocessImageForOcr(file: File | Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.max(2, Math.min(3, 2400 / Math.max(bitmap.width, 1)));

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) return file instanceof File ? file : new File([file], "ocr.png");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;
  const contrast = 1.35;
  const intercept = 128 * (1 - contrast);

  for (let i = 0; i < data.length; i += 4) {
    const gray =
      data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    const enhanced = Math.max(0, Math.min(255, gray * contrast + intercept));
    data[i] = enhanced;
    data[i + 1] = enhanced;
    data[i + 2] = enhanced;
  }

  ctx.putImageData(imageData, 0, 0);

  // Làm nét nhẹ giúp phân biệt 3 và 5.
  const sharpened = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const src = sharpened.data;
  const copy = new Uint8ClampedArray(src);
  const w = canvas.width;
  const h = canvas.height;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      const center = copy[idx];
      const neighbors =
        copy[idx - 4] +
        copy[idx + 4] +
        copy[idx - w * 4] +
        copy[idx + w * 4];
      const value = Math.max(
        0,
        Math.min(255, center * 1.4 - (neighbors / 4) * 0.4),
      );
      src[idx] = value;
      src[idx + 1] = value;
      src[idx + 2] = value;
    }
  }

  ctx.putImageData(sharpened, 0, 0);

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
