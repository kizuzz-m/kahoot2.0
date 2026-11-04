"use client";

/** Verkleinert ein hochgeladenes Bild und liefert eine JPEG/WebP-data-URL (spart Speicher und Bandbreite). */
export async function fileToResizedDataUrl(file: File, maxSize = 1024, quality = 0.82): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Bitte wähle eine Bilddatei aus.");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Bild konnte nicht gelesen werden."));
      el.src = url;
    });
    const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas nicht verfügbar");
    ctx.drawImage(img, 0, 0, w, h);
    const webp = canvas.toDataURL("image/webp", quality);
    return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
