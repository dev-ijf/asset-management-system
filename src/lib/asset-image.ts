import sharp from "sharp";
import { randomUUID } from "node:crypto";

export class PhotoError extends Error {}
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

export async function compressAssetPhoto(file: File) {
  if (!file.size || file.size > MAX_PHOTO_BYTES) throw new PhotoError("Foto harus berukuran 1 byte sampai 10 MB.");
  if (!/\.(jpe?g|png|webp)$/i.test(file.name) || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new PhotoError("Format foto harus JPG, JPEG, PNG, atau WebP.");
  }
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const image = sharp(bytes, { limitInputPixels: 40_000_000, failOn: "warning" });
    const meta = await image.metadata();
    if (!["jpeg", "png", "webp"].includes(meta.format ?? "") || (meta.pages ?? 1) > 1) {
      throw new PhotoError("Gunakan foto JPG, PNG, atau WebP non-animasi.");
    }
    // Sharp removes metadata by default. Decode fully before uploading.
    return await image.rotate().resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78 }).toBuffer();
  } catch (error) {
    if (error instanceof PhotoError) throw error;
    throw new PhotoError("Foto tidak valid, rusak, atau melebihi batas 40 megapiksel.");
  }
}

export function assetPhotoFilename(code: string) {
  return `${code.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80) || "asset"}-${randomUUID()}.webp`;
}

export function optionalPhoto(formData: FormData) {
  const file = formData.get("photo");
  if (file === null || (file instanceof File && file.size === 0 && !file.name)) return null;
  if (!(file instanceof File)) throw new PhotoError("File foto tidak valid.");
  return file;
}
