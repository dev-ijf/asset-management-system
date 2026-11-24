import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { PhotoError } from "@/lib/asset-image";
import { discardPreparedPhoto, prepareAssetPhoto, type PreparedPhoto } from "@/lib/asset-photo-storage";

/** Photos of the damage a maintenance request may carry. */
export const MAX_MAINTENANCE_PHOTOS = 3;

/** The chosen photo files (empty parts skipped). */
export function maintenancePhotoFiles(formData: FormData) {
  const files = formData
    .getAll("photos")
    .filter((value): value is File => value instanceof File && value.size > 0);
  if (files.length > MAX_MAINTENANCE_PHOTOS) throw new PhotoError(`Maksimal ${MAX_MAINTENANCE_PHOTOS} foto.`);
  return files;
}

/**
 * Compresses and uploads the photos to Drive. Each upload is queued for cleanup until
 * `attachMaintenancePhotos` records it, so a failed request does not leave files behind.
 */
export async function prepareMaintenancePhotos(files: File[], assetCode: string) {
  const prepared: PreparedPhoto[] = [];
  try {
    for (const file of files) prepared.push(await prepareAssetPhoto(file, `${assetCode}-maintenance`));
    return prepared;
  } catch (error) {
    await discardMaintenancePhotos(prepared);
    throw error;
  }
}

export async function attachMaintenancePhotos(
  tx: Prisma.TransactionClient,
  photos: PreparedPhoto[],
  link: { assetId: string; approvalRequestId?: string; maintenanceId?: string },
) {
  for (const photo of photos) {
    await tx.maintenancePhoto.create({
      data: {
        id: photo.id,
        assetId: link.assetId,
        approvalRequestId: link.approvalRequestId ?? null,
        maintenanceId: link.maintenanceId ?? null,
        driveFileId: photo.driveFileId,
        filename: photo.filename,
        mimeType: photo.mimeType,
        size: photo.size,
      },
    });
    await tx.drivePhotoCleanup.delete({ where: { fileId: photo.driveFileId } });
  }
}

export async function discardMaintenancePhotos(photos: PreparedPhoto[]) {
  for (const photo of photos) await discardPreparedPhoto(photo);
}
