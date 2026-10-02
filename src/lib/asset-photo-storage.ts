import { randomUUID } from "node:crypto";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { assetPhotoFilename, compressAssetPhoto, PhotoError } from "@/lib/asset-image";
import { allocateDrivePhoto, uploadDrivePhoto, deleteDrivePhoto } from "@/lib/google-drive";

export async function prepareAssetPhoto(file: File, code: string) {
  const bytes = await compressAssetPhoto(file);
  const filename = assetPhotoFilename(code);
  const driveFileId = await allocateDrivePhoto();
  // Durable compensation is recorded BEFORE upload, including uncertain network failures.
  await prisma.drivePhotoCleanup.create({ data: { fileId: driveFileId, dueAt: new Date(Date.now() + 86400000) } });
  await uploadDrivePhoto(driveFileId, filename, bytes);
  return { id: randomUUID(), driveFileId, filename, mimeType: "image/webp", size: bytes.length };
}

export type PreparedPhoto = Awaited<ReturnType<typeof prepareAssetPhoto>>;

export async function attachAssetPhoto(tx: Prisma.TransactionClient, assetId: string, photo: PreparedPhoto, isPrimary: boolean) {
  await tx.assetPhoto.create({ data: { ...photo, assetId, isPrimary, path: `/api/assets/${assetId}/photos/${photo.id}` } });
  await tx.drivePhotoCleanup.delete({ where: { fileId: photo.driveFileId } });
}

export async function queuePhotoDeletion(tx: Prisma.TransactionClient, fileId: string) {
  await tx.drivePhotoCleanup.upsert({ where: { fileId }, create: { fileId, dueAt: new Date() }, update: { dueAt: new Date() } });
}

export async function discardPreparedPhoto(photo: PreparedPhoto | undefined) {
  if (!photo) return;
  try {
    await prisma.drivePhotoCleanup.updateMany({ where: { fileId: photo.driveFileId }, data: { dueAt: new Date() } });
    await cleanupDrivePhotos([photo.driveFileId]);
  } catch { /* Durable compensation remains queued if DB or Drive is unavailable. */ }
}

export async function cleanupDrivePhotos(fileIds?: string[]) {
  const jobs = await prisma.drivePhotoCleanup.findMany({ where: { dueAt: { lte: new Date() }, ...(fileIds ? { fileId: { in: fileIds } } : {}) }, take: 10, orderBy: { dueAt: "asc" } });
  let failed = 0;
  for (const job of jobs) {
    try {
      // Never delete a file still referenced by any asset, including soft-deleted assets.
      if (!await prisma.assetPhoto.findUnique({ where: { driveFileId: job.fileId }, select: { id: true } })) {
        await deleteDrivePhoto(job.fileId);
      }
      await prisma.drivePhotoCleanup.deleteMany({ where: { fileId: job.fileId } });
    } catch {
      failed++;
      await prisma.drivePhotoCleanup.updateMany({ where: { fileId: job.fileId },
        data: { attempts: { increment: 1 }, dueAt: new Date(Date.now() + 300000) } });
    }
  }
  return { processed: jobs.length, failed };
}

export async function cleanupPhotosSafely(fileIds: string[] = []) {
  try { return await cleanupDrivePhotos(fileIds); }
  catch { return { processed: 0, failed: 1 }; }
}

export async function removePhotoRecord(tx: Prisma.TransactionClient, assetId: string, photoId: string) {
  const photo = await tx.assetPhoto.findFirst({ where: { id: photoId, assetId } });
  if (!photo) throw new PhotoError("Foto telah berubah. Tutup dan buka kembali form edit.");
  if (photo.driveFileId) await queuePhotoDeletion(tx, photo.driveFileId);
  await tx.assetPhoto.delete({ where: { id: photo.id } });
  return photo;
}

export async function ensurePrimaryPhoto(tx: Prisma.TransactionClient, assetId: string) {
  const photos = await tx.assetPhoto.findMany({ where: { assetId }, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] });
  if (photos.length) {
    await tx.assetPhoto.updateMany({ where: { assetId }, data: { isPrimary: false } });
    await tx.assetPhoto.update({ where: { id: photos[0].id }, data: { isPrimary: true } });
  }
}

// Preserve old local photos until explicitly removed/replaced; never delete arbitrary paths.
export async function deleteLegacyPhoto(photo: { path: string; driveFileId: string | null } | undefined) {
  if (!photo || photo.driveFileId || !/^\/uploads\/assets\/[\w-]+\/[\w.-]+$/.test(photo.path)) return;
  for (const root of [path.resolve("public"), path.resolve("src/public")]) {
    const target = path.resolve(root, `.${photo.path}`);
    if (!target.startsWith(root + path.sep)) continue;
    try { await unlink(target); } catch { /* Legacy file may already be missing. */ }
  }
}
