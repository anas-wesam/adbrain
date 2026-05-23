// Resize + compress image to max 1024px and quality 0.85 before upload
export async function compressImage(
  base64: string,
  mime: string,
  maxPx = 1024,
  quality = 0.85
): Promise<{ base64: string; mime: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);

      const outMime = "image/jpeg";
      const dataUrl = canvas.toDataURL(outMime, quality);
      const outBase64 = dataUrl.split(",")[1];
      resolve({ base64: outBase64, mime: outMime });
    };
    img.src = `data:${mime};base64,${base64}`;
  });
}
