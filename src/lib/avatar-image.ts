/**
 * Turns a picked photo into a small square JPEG data URL so avatars stay tiny in storage.
 */

import { AVATAR_SIZE_PX, MAX_AVATAR_DATA_URL_LENGTH } from "./spot-validation";

const MAX_SOURCE_BYTES = 15 * 1024 * 1024;

// Reads through a data: URL because the site's Content-Security-Policy does not allow blob: images.
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("unreadable"));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("unreadable"));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export async function photoToAvatar(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > MAX_SOURCE_BYTES)
    throw new Error("That photo is too large. Try one under 15 MB.");

  const img = await loadImage(file).catch(() => {
    throw new Error("That photo couldn't be read. Try a JPG or PNG.");
  });
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE_PX;
  canvas.height = AVATAR_SIZE_PX;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("That photo couldn't be processed.");
  ctx.drawImage(
    img,
    (img.naturalWidth - side) / 2,
    (img.naturalHeight - side) / 2,
    side,
    side,
    0,
    0,
    AVATAR_SIZE_PX,
    AVATAR_SIZE_PX,
  );

  for (const quality of [0.85, 0.7, 0.5]) {
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (dataUrl.length <= MAX_AVATAR_DATA_URL_LENGTH) return dataUrl;
  }
  throw new Error("That photo couldn't be processed.");
}
