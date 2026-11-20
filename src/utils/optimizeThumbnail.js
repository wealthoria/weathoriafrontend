/**
 * Resizes and compresses an uploaded image thumbnail into a lightweight WebP file
 * (max width 640px, target size < 80 KB) before uploading to Firebase/backend.
 */
export async function optimizeThumbnailToWebP(
  file,
  { maxWidth = 640, maxBytes = 80 * 1024 } = {}
) {
  if (!file || typeof file.type !== "string" || !file.type.startsWith("image/")) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (!width || !height) {
        resolve(file);
        return;
      }

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      const toWebpBlob = (quality) =>
        new Promise((res) => {
          canvas.toBlob((blob) => res(blob), "image/webp", quality);
        });

      const qualities = [0.82, 0.72, 0.62, 0.52, 0.42];
      let bestBlob = null;

      for (const q of qualities) {
        const blob = await toWebpBlob(q);
        if (!blob) break;
        bestBlob = blob;
        if (blob.size <= maxBytes) break;
      }

      if (!bestBlob) {
        resolve(file);
        return;
      }

      const baseName = (file.name || "thumbnail").replace(/\.[^/.]+$/, "");
      const optimized = new File([bestBlob], `${baseName}.webp`, {
        type: "image/webp",
        lastModified: Date.now(),
      });

      resolve(optimized);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

